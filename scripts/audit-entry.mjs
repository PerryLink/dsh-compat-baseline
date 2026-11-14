#!/usr/bin/env node
// HCB v0.5 ENTRY evidence auditor.
//
//   node scripts/audit-entry.mjs dsh-plugin-guide
//   node scripts/audit-entry.mjs dsh-plugin-guide --merge
//
// What it does:
//   1. npm pack <pkg>@<latest|version> into a throwaway directory
//   2. validate + extract the tarball (no install, no lifecycle scripts)
//   3. run dsh-standards@1.6.10 --scope entry --entry-claim static --format json
//   4. write the raw checker report + an hcb-evidence-patch/1 patch
//   5. with --merge, write standards.entry + evidence into data/matrix.json
//
// Default is a dry run: the matrix is NOT touched. Exit 0 = pass/warn,
// 1 = package FAIL, 2 = evidence BLOCKED, 3 = the audit itself could not run.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  EVIDENCE_SCHEMA,
  applyEvidencePatch,
  entryStatusFromReport,
  evidenceFromReport,
  isIsoInstant,
  validateEvidence,
} from './lib/evidence.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..');
const CHECKER = { package: 'dsh-standards', version: '1.6.10', minNode: [24, 9, 0] };
const PATCH_SCHEMA = 'hcb-evidence-patch/1';
const MAX_UNPACKED_BYTES = 64 * 1024 * 1024;

class AuditError extends Error {
  constructor(message, { exitCode = 3, detail = null } = {}) {
    super(message);
    this.name = 'AuditError';
    this.exitCode = exitCode;
    this.detail = detail;
  }
}

function usage() {
  return `Usage: node scripts/audit-entry.mjs <npm-package> [options]

Audit one published package against DSH-ENTRY (static claim) and write an
evidence patch. The default is a dry run; pass --merge to update the matrix.

Options:
  --version <v>          package version (default: latest)
  --host-version <v>     DSH host anchor (default: data/matrix.json latestHost)
  --matrix <file>        matrix to patch (default: data/matrix.json)
  --backup <file>        backup path (default: <matrix-dir>/matrix.v0.4.backup.json)
  --evidence-dir <dir>   report root inside this repo (default: evidence)
  --out <file>           patch path (default: <evidence-dir>/<pkg>/<version>/<host>/<stamp>/patch.json)
  --install-spec <spec>  value passed to the checker (default: <pkg>@<packed-version>)
  --no-install-spec      do not pass --install-spec to the checker
  --merge                write the result into data/matrix.json (backup first)
  --keep-temp            keep the npm pack / unpack / checker temp directory
  --json                 print the patch summary as JSON
  --timeout <ms>         per-command timeout (default: 180000)
  --help                 show this help

Exit: 0 pass/warn, 1 package failed, 2 evidence blocked, 3 audit could not run.
`;
}

function parseArgs(argv) {
  const opts = {
    package: null,
    version: 'latest',
    hostVersion: null,
    matrix: path.join(REPO, 'data', 'matrix.json'),
    backup: null,
    evidenceDir: path.join(REPO, 'evidence'),
    out: null,
    installSpec: true,
    merge: false,
    keepTemp: false,
    json: false,
    timeout: 180000,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const value = (name) => {
      const next = argv[++i];
      if (next === undefined || next.startsWith('--')) throw new AuditError(`${name} needs a value`);
      return next;
    };
    switch (arg) {
      case '--help': case '-h': console.log(usage()); process.exit(0); break;
      case '--version': opts.version = value('--version'); break;
      case '--host-version': opts.hostVersion = value('--host-version'); break;
      case '--matrix': opts.matrix = path.resolve(value('--matrix')); break;
      case '--backup': opts.backup = path.resolve(value('--backup')); break;
      case '--evidence-dir': opts.evidenceDir = path.resolve(value('--evidence-dir')); break;
      case '--out': opts.out = path.resolve(value('--out')); break;
      case '--install-spec': opts.installSpec = value('--install-spec'); break;
      case '--no-install-spec': opts.installSpec = false; break;
      case '--merge': opts.merge = true; break;
      case '--keep-temp': opts.keepTemp = true; break;
      case '--json': opts.json = true; break;
      case '--timeout': {
        const ms = Number(value('--timeout'));
        if (!Number.isFinite(ms) || ms < 1000) throw new AuditError('--timeout must be >= 1000 ms');
        opts.timeout = ms;
        break;
      }
      default:
        if (arg.startsWith('--')) throw new AuditError(`unknown option: ${arg}`);
        if (opts.package) throw new AuditError(`unexpected argument: ${arg}`);
        opts.package = arg;
    }
  }
  if (!opts.package) throw new AuditError('missing npm package name\n\n' + usage());
  if (opts.package.includes('@') && !opts.package.startsWith('@')) {
    throw new AuditError('pass the package name separately: <name> --version <v>');
  }
  if (opts.package.startsWith('@')) {
    const parts = opts.package.split('/');
    if (parts.length !== 2 || parts[1].includes('@')) {
      throw new AuditError('scoped package must be @scope/name; use --version for the version');
    }
  } else if (opts.package.includes('/')) {
    throw new AuditError('package name must not contain "/"');
  }
  if (opts.version !== 'latest' && !/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(opts.version)) {
    throw new AuditError(`invalid --version: ${opts.version}`);
  }
  return opts;
}

function assertNode() {
  const [major, minor, patch] = process.versions.node.split('.').map(Number);
  const [minMajor, minMinor, minPatch] = CHECKER.minNode;
  if (major < minMajor || (major === minMajor && (minor < minMinor || (minor === minMinor && patch < minPatch)))) {
    throw new AuditError(`${CHECKER.package}@${CHECKER.version} requires Node >= ${CHECKER.minNode.join('.')}; this is ${process.versions.node}`);
  }
}

function npmTool(name) {
  const binDir = path.dirname(process.execPath);
  const candidates = [
    path.resolve(binDir, '..', 'lib', 'node_modules', 'npm', 'bin', `${name}-cli.js`),
    path.resolve(binDir, 'node_modules', 'npm', 'bin', `${name}-cli.js`),
    path.resolve(binDir, '..', 'node_modules', 'npm', 'bin', `${name}-cli.js`),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return { command: process.execPath, args: [candidate], shell: false };
  }
  const fallback = process.platform === 'win32' ? `${name}.cmd` : name;
  return { command: fallback, args: [], shell: process.platform === 'win32' };
}

function run(command, args, { cwd, timeout, env = {}, shell = false } = {}) {
  const started = Date.now();
  const result = spawnSync(command, args, {
    cwd,
    timeout,
    shell,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
    env: { ...process.env, ...env },
  });
  const elapsedMs = Date.now() - started;
  if (result.error) throw new AuditError(`failed to run ${command}: ${result.error.message}`, { detail: { command, args } });
  if (result.signal) throw new AuditError(`${command} was killed by ${result.signal} after ${elapsedMs} ms`);
  return { status: result.status, stdout: result.stdout || '', stderr: result.stderr || '', elapsedMs, command, args };
}

function parseJsonOutput(text, label) {
  const raw = String(text || '').trim();
  if (!raw) throw new AuditError(`${label} produced no stdout`);
  try { return JSON.parse(raw); } catch {}
  const objectStart = raw.indexOf('{');
  const objectEnd = raw.lastIndexOf('}');
  if (objectStart >= 0 && objectEnd > objectStart) {
    try { return JSON.parse(raw.slice(objectStart, objectEnd + 1)); } catch {}
  }
  const arrayStart = raw.indexOf('[');
  const arrayEnd = raw.lastIndexOf(']');
  if (arrayStart >= 0 && arrayEnd > arrayStart) {
    try { return JSON.parse(raw.slice(arrayStart, arrayEnd + 1)); } catch {}
  }
  throw new AuditError(`${label} did not produce parseable JSON`);
}

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (error) { throw new AuditError(`cannot read ${file}: ${error.message}`); }
}

function sha256File(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function safeSegment(value) {
  return String(value).replace(/^@/, '').replace(/[\\/:*?"<>|\s]+/g, '__');
}

function stampOf(date) {
  return date.toISOString().replace(/[:.]/g, '-');
}

function displayPath(absolute) {
  const rel = path.relative(REPO, absolute);
  return (rel && !rel.startsWith('..') && !path.isAbsolute(rel)) ? rel.split(path.sep).join('/') : absolute;
}

function relativeToRepo(absolute) {
  const rel = path.relative(REPO, absolute);
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new AuditError(`path must stay inside ${REPO}: ${absolute}`);
  }
  return rel.split(path.sep).join('/');
}

function assertInsideRepo(absolute, label) {
  const rel = path.relative(REPO, absolute);
  if (rel === '' || rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new AuditError(`${label} must stay inside the repository (${REPO}): ${absolute}`);
  }
}

function packPackage(opts, tempDir) {
  const packDir = path.join(tempDir, 'pack');
  fs.mkdirSync(packDir, { recursive: true });
  const spec = opts.version === 'latest' ? opts.package : `${opts.package}@${opts.version}`;
  const npm = npmTool('npm');
  const result = run(npm.command, [...npm.args, 'pack', spec, '--json'], { cwd: packDir, timeout: opts.timeout, shell: npm.shell });
  if (result.status !== 0) {
    throw new AuditError(`npm pack ${spec} failed (exit ${result.status})`, { detail: { stderr: result.stderr.trim() } });
  }
  let info;
  try { info = parseJsonOutput(result.stdout, 'npm pack'); } catch (error) {
    throw new AuditError(`npm pack ${spec} returned no JSON: ${error.message}`, { detail: { stdout: result.stdout.slice(0, 2000) } });
  }
  const entry = Array.isArray(info) ? info[0] : info;
  if (!entry?.filename || !entry?.name || !entry?.version) throw new AuditError('npm pack JSON is missing filename/name/version');
  if (entry.filename !== path.basename(entry.filename)) throw new AuditError(`unsafe npm pack filename: ${entry.filename}`);
  if (Number(entry.unpackedSize) > MAX_UNPACKED_BYTES) {
    throw new AuditError(`refusing to unpack ${entry.unpackedSize} bytes (limit ${MAX_UNPACKED_BYTES})`);
  }
  const tarball = path.join(packDir, entry.filename);
  if (!fs.existsSync(tarball)) throw new AuditError(`npm pack reported ${entry.filename}, but it is missing`);
  return { entry, tarball, spec, result };
}

function assertSafeTarball(tarball) {
  const result = run('tar', ['-tzf', tarball], { timeout: 60000 });
  if (result.status !== 0) throw new AuditError(`tar -tzf failed (exit ${result.status})`, { detail: { stderr: result.stderr.trim() } });
  const entries = result.stdout.split(/\r?\n/).filter(Boolean);
  if (!entries.length) throw new AuditError('tarball is empty');
  for (const entry of entries) {
    const normalized = entry.replace(/\\/g, '/');
    if (normalized.startsWith('/') || /^[A-Za-z]:/.test(normalized) || normalized.split('/').includes('..')) {
      throw new AuditError(`unsafe path in tarball: ${entry}`);
    }
  }
  return entries;
}

function assertNoSymlinks(root) {
  const stack = [root];
  let seen = 0;
  while (stack.length) {
    const dir = stack.pop();
    for (const dirent of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, dirent.name);
      if (++seen > 50000) throw new AuditError('unpacked package has more than 50000 entries');
      const stat = fs.lstatSync(full);
      if (stat.isSymbolicLink()) throw new AuditError(`refusing symlink in package: ${path.relative(root, full)}`);
      if (stat.isDirectory()) stack.push(full);
    }
  }
}

function unpackPackage(tarball, tempDir) {
  const unpacked = path.join(tempDir, 'unpacked');
  fs.mkdirSync(unpacked, { recursive: true });
  assertSafeTarball(tarball);
  const result = run('tar', ['-xzf', tarball, '-C', unpacked, '--strip-components=1', '--no-same-owner'], { timeout: 60000 });
  if (result.status !== 0) throw new AuditError(`tar extraction failed (exit ${result.status})`, { detail: { stderr: result.stderr.trim() } });
  assertNoSymlinks(unpacked);
  const manifestPath = path.join(unpacked, 'package.json');
  if (!fs.existsSync(manifestPath)) throw new AuditError('unpacked package has no package.json');
  return { unpacked, manifest: readJson(manifestPath) };
}

function runChecker(opts, unpacked, version, hostVersion, tempDir) {
  const npx = npmTool('npx');
  const args = ['-y', `${CHECKER.package}@${CHECKER.version}`, unpacked, '--scope', 'entry', '--entry-claim', 'static', '--format', 'json', '--host-version', hostVersion];
  if (opts.installSpec !== false) {
    const spec = typeof opts.installSpec === 'string' ? opts.installSpec : `${opts.package}@${version}`;
    args.push('--install-spec', spec);
  }
  const result = run(npx.command, [...npx.args, ...args], { cwd: tempDir, timeout: opts.timeout, shell: npx.shell });
  if (![0, 1, 2].includes(result.status)) {
    throw new AuditError(`checker exited ${result.status}; refusing to write evidence`, {
      detail: { stderr: result.stderr.trim(), stdout: result.stdout.slice(0, 2000) },
    });
  }
  let report;
  try { report = parseJsonOutput(result.stdout, 'checker'); } catch (error) {
    throw new AuditError(`checker did not return JSON: ${error.message}`, { detail: { stderr: result.stderr.trim() } });
  }
  if (!report?.conclusion || !report?.subject) throw new AuditError('checker report is missing subject/conclusion');
  if ([0, 1, 2].includes(result.status) && report.conclusion.exitCode !== undefined && result.status !== report.conclusion.exitCode) {
    throw new AuditError(`checker exit ${result.status} disagrees with report exit ${report.conclusion.exitCode}`);
  }
  return { report, result, args };
}

function optsInstallSpecClause(name, version, installSpec) {
  return installSpec === false ? '' : ` --install-spec ${name}@${version}`;
}

function buildPatch({ report, entryStatus, evidence, row, name, version, hostVersion, reportPath, reportSha256, command, result, packInfo, installSpec }) {
  const previousStatus = row?.standards?.entry?.status ?? 'unknown';
  const wasChecked = row?.evidence && row.evidence.source !== 'declared';
  const declaredStatus = wasChecked ? (row.standards?.entry?.declaredStatus ?? previousStatus) : previousStatus;
  const afterEntry = { ...(row?.standards?.entry || {}) };
  afterEntry.status = entryStatus;
  if (declaredStatus !== entryStatus) afterEntry.declaredStatus = declaredStatus;
  else delete afterEntry.declaredStatus;
  const checks = (report.checks || []).map(c => ({ id: c.id, result: c.result, coverage: c.coverage, reason: c.reason || '' }));
  return {
    schema: PATCH_SCHEMA,
    createdAt: evidence.checkedAt,
    package: name,
    version,
    host: evidence.host,
    checker: evidence.checker,
    entryStatus,
    checkerStatus: report.conclusion.status,
    checkerLevel: report.conclusion.level ?? null,
    exitCode: result.status,
    rowFound: Boolean(row),
    reportPath,
    reportSha256,
    evidence,
    command,
    reproduce: [
      `npm pack ${name}@${version}`,
      `tar -xzf ${packInfo.filename} -C ./unpacked --strip-components=1`,
      `npx -y ${CHECKER.package}@${CHECKER.version} ./unpacked --scope entry --entry-claim static --format json --host-version ${hostVersion}${optsInstallSpecClause(name, version, installSpec)}`,
    ],
    artifact: {
      filename: packInfo.filename,
      shasum: packInfo.shasum ?? null,
      integrity: packInfo.integrity ?? null,
      unpackedSize: packInfo.unpackedSize ?? null,
      entryCount: packInfo.entryCount ?? null,
    },
    before: row ? {
      version: row.version,
      standardsEntry: row.standards?.entry ?? null,
      evidence: row.evidence ?? null,
      gate: row.gate ?? null,
    } : null,
    after: { version, standardsEntry: afterEntry, evidence },
    report: {
      headline: report.conclusion.headline ?? '',
      reason: report.conclusion.reason ?? '',
      level: report.conclusion.level ?? null,
      status: report.conclusion.status,
      coverage: report.coverage ?? null,
      buckets: {
        blocking: report.buckets?.blocking ?? [],
        hygiene: report.buckets?.hygiene ?? [],
      },
      checks,
      notChecked: report.notChecked ?? [],
    },
  };
}

function ensureBackup(matrixPath, backupPath) {
  if (fs.existsSync(backupPath)) return { path: backupPath, created: false };
  fs.mkdirSync(path.dirname(backupPath), { recursive: true });
  try {
    fs.copyFileSync(matrixPath, backupPath, fs.constants.COPYFILE_EXCL);
  } catch (error) {
    if (error.code !== 'EEXIST') throw new AuditError(`cannot create backup ${backupPath}: ${error.message}`);
  }
  return { path: backupPath, created: true };
}

function writeAtomic(file, text) {
  const tmp = `${file}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(tmp, text);
  try {
    fs.renameSync(tmp, file);
  } catch (error) {
    fs.copyFileSync(tmp, file);
    fs.unlinkSync(tmp);
  }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  assertNode();
  assertInsideRepo(opts.evidenceDir, '--evidence-dir');
  const matrixPath = path.resolve(opts.matrix);
  const matrix = readJson(matrixPath);
  if (!Array.isArray(matrix.rows)) throw new AuditError(`${matrixPath} has no rows[]`);
  if (!matrix.latestHost) throw new AuditError(`${matrixPath} has no latestHost`);
  const hostVersion = opts.hostVersion || matrix.latestHost;
  if (!/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(hostVersion)) throw new AuditError(`invalid host version: ${hostVersion}`);
  const row = matrix.rows.find(r => r.name === opts.package) || null;
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hcb-audit-'));
  try {
    const packed = packPackage(opts, tempDir);
    if (packed.entry.name !== opts.package) {
      throw new AuditError(`npm pack returned ${packed.entry.name}, expected ${opts.package}`);
    }
    if (opts.version !== 'latest' && packed.entry.version !== opts.version) {
      throw new AuditError(`npm pack returned ${packed.entry.version}, expected ${opts.version}`);
    }
    const { unpacked, manifest } = unpackPackage(packed.tarball, tempDir);
    if (manifest.name !== packed.entry.name || manifest.version !== packed.entry.version) {
      throw new AuditError(`tarball package.json says ${manifest.name}@${manifest.version}, npm pack says ${packed.entry.name}@${packed.entry.version}`);
    }
    const { report, result, args } = runChecker(opts, unpacked, packed.entry.version, hostVersion, tempDir);
    if (report.subject.name !== packed.entry.name || report.subject.version !== packed.entry.version) {
      throw new AuditError(`checker subject ${report.subject.name}@${report.subject.version} does not match packed ${packed.entry.name}@${packed.entry.version}`);
    }
    if (report.anchor?.suspect) throw new AuditError('checker marked its version anchor as suspect; refusing to write evidence');
    if (report.anchor?.dsh !== hostVersion) {
      throw new AuditError(`checker anchored on ${report.anchor?.dsh}, expected ${hostVersion}; refusing to write evidence`);
    }
    const entryStatus = entryStatusFromReport(report);
    if (!entryStatus) throw new AuditError(`cannot map checker conclusion to an ENTRY state (status=${report.conclusion.status}, level=${report.conclusion.level})`);
    if (entryStatus === 'runtime') throw new AuditError('a --entry-claim static audit cannot produce ENTRY runtime; use a tested runtime harness');

    const checkedAt = new Date().toISOString();
    if (!isIsoInstant(checkedAt)) throw new AuditError('internal error: checkedAt is not an ISO instant');
    const stamp = stampOf(new Date(checkedAt));
    const dir = path.join(opts.evidenceDir, safeSegment(packed.entry.name), safeSegment(packed.entry.version), safeSegment(hostVersion), stamp);
    fs.mkdirSync(dir, { recursive: true });
    const reportFile = path.join(dir, 'report.json');
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2) + '\n');
    const reportPath = relativeToRepo(reportFile);
    const reportSha256 = sha256File(reportFile);
    const evidence = evidenceFromReport({ report, checkedAt, reportPath, checkerVersion: CHECKER.version });
    const evidenceErrors = validateEvidence(evidence);
    if (evidenceErrors.length) throw new AuditError('checker evidence is invalid: ' + evidenceErrors.join('; '));

    fs.writeFileSync(path.join(dir, 'pack.json'), JSON.stringify(packed.entry, null, 2) + '\n');
    fs.writeFileSync(path.join(dir, 'checker.stdout.json'), JSON.stringify(report, null, 2) + '\n');
    if (result.stderr.trim()) fs.writeFileSync(path.join(dir, 'checker.stderr.log'), result.stderr);
    fs.writeFileSync(path.join(dir, 'audit.json'), JSON.stringify({
      schema: 'hcb-audit-run/1',
      createdAt: checkedAt,
      command: ['npx', ...args],
      cwd: tempDir,
      node: process.versions.node,
      platform: `${process.platform}-${process.arch}`,
      checkerExit: result.status,
      elapsedMs: result.elapsedMs,
      hostVersion,
      package: packed.entry.name,
      version: packed.entry.version,
      reportSha256,
      subjectPathInReport: report.subject?.path ?? null,
      note: 'subject.path is the throwaway unpack directory and is expected to disappear; the report bytes are the evidence.',
    }, null, 2) + '\n');

    const patch = buildPatch({
      report,
      entryStatus,
      evidence,
      row,
      name: packed.entry.name,
      version: packed.entry.version,
      hostVersion,
      reportPath,
      reportSha256,
      command: ['npx', ...args],
      result,
      packInfo: packed.entry,
      installSpec: opts.installSpec,
    });
    const patchFile = opts.out || path.join(dir, 'patch.json');
    fs.mkdirSync(path.dirname(patchFile), { recursive: true });
    fs.writeFileSync(patchFile, JSON.stringify(patch, null, 2) + '\n');

    let merged = null;
    if (opts.merge) {
      if (!row) throw new AuditError(`${opts.package} is not in ${matrixPath}; add it to data/plugins.seed.json first`);
      const backupPath = opts.backup || path.join(path.dirname(matrixPath), 'matrix.v0.4.backup.json');
      if (path.resolve(backupPath) === matrixPath) throw new AuditError('--backup must not be the matrix itself');
      const backup = ensureBackup(matrixPath, backupPath);
      const reportAbs = path.join(REPO, evidence.reportPath);
      if (!fs.existsSync(reportAbs)) throw new AuditError(`report missing at ${reportAbs}; refusing to merge`);
      if (sha256File(reportAbs) !== reportSha256) throw new AuditError('report bytes changed after the audit; refusing to merge');
      const working = JSON.parse(JSON.stringify(matrix));
      merged = applyEvidencePatch(working, patch, { latestHost: matrix.latestHost });
      writeAtomic(matrixPath, JSON.stringify(working, null, 2) + '\n');
      merged.backup = backup;
    }

    const summary = {
      ok: entryStatus !== 'failed' && entryStatus !== 'blocked',
      package: packed.entry.name,
      version: packed.entry.version,
      host: hostVersion,
      entryStatus,
      previousEntryStatus: row?.standards?.entry?.status ?? null,
      declaredStatus: merged?.declaredStatus ?? patch.after.standardsEntry.declaredStatus ?? null,
      checkerStatus: report.conclusion.status,
      checkerLevel: report.conclusion.level ?? null,
      checks: `${report.coverage?.checked ?? '?'}/${report.coverage?.total ?? '?'}`,
      blocking: report.buckets?.blocking?.length ?? null,
      warnings: (report.buckets?.hygiene || []).map(x => x.id),
      notChecked: (report.notChecked || []).map(x => x.id),
      reportPath,
      patch: displayPath(patchFile),
      merged: Boolean(merged),
      backup: merged?.backup?.path ?? null,
      restored: false,
    };
    if (opts.json) console.log(JSON.stringify(summary, null, 2));
    else {
      console.log(`HCB ENTRY audit: ${summary.package}@${summary.version} vs DSH ${summary.host}`);
      console.log(`  checker : ${evidence.checker} -> ${summary.checkerStatus} / ${summary.checkerLevel ?? 'no level'}`);
      console.log(`  ENTRY   : ${summary.previousEntryStatus ?? '(not in matrix)'} -> ${summary.entryStatus} (evidence=${evidence.source})`);
      console.log(`  checks  : ${summary.checks}; blocking=${summary.blocking ?? '?'}; warnings=${summary.warnings.join(', ') || 'none'}; not-checked=${summary.notChecked.join(', ') || 'none'}`);
      console.log(`  report  : ${reportPath}`);
      console.log(`  patch   : ${summary.patch}`);
      if (merged) console.log(`  matrix  : merged (backup: ${merged.backup.path})`);
      else console.log('  matrix  : not modified (dry run; pass --merge to write)');
    }
    return entryStatus === 'failed' ? 1 : entryStatus === 'blocked' ? 2 : 0;
  } finally {
    if (opts.keepTemp) console.log(`temp kept: ${tempDir}`);
    else {
      try { fs.rmSync(tempDir, { recursive: true, force: true }); }
      catch (error) { console.error(`audit-entry: could not remove temp dir ${tempDir}: ${error.message}`); }
    }
  }
}

main().then(code => process.exit(code)).catch(error => {
  console.error('audit-entry: ' + (error instanceof AuditError ? error.message : error.stack || error));
  if (error instanceof AuditError && error.detail) {
    for (const [key, value] of Object.entries(error.detail)) if (value) console.error(`  ${key}: ${String(value).trim().slice(0, 4000)}`);
  }
  process.exit(error instanceof AuditError ? error.exitCode : 3);
});
