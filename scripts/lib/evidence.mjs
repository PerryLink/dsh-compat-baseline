// HCB v0.5 evidence model.
//
// A row's `evidence` object answers one question: how was this row's ENTRY
// status obtained? It is deliberately small and has exactly one meaning per
// source:
//
//   declared -> read from package metadata / npm; no independent check
//   checked  -> a named checker ran against the packed artifact (no boot)
//   tested   -> a real host boot / journey ran (not produced by v0.5)
//
// The matrix keeps `standards` untouched in meaning; `standards.entry.status`
// is the effective ENTRY state and `standards.entry.declaredStatus` preserves
// the author's original claim when a check overrides it.

import { gateOf } from './gate.mjs';

export const EVIDENCE_SCHEMA = 'hcb-evidence/1';
export const EVIDENCE_SOURCES = ['declared', 'checked', 'tested'];
export const ENTRY_STATUSES = ['runtime', 'recognized', 'static', 'blocked', 'failed', 'not-run', 'stale', 'unknown'];

const STATUS_RANK = {
  unknown: 0,
  'not-run': 1,
  blocked: 2,
  failed: 2,
  static: 3,
  recognized: 3,
  runtime: 4,
};

export function declaredEvidence() {
  return {
    source: 'declared',
    checkedAt: null,
    host: null,
    checker: null,
    reportPath: null,
  };
}

export function isIsoInstant(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.toISOString() === value;
}

export function validateEvidence(evidence) {
  const errors = [];
  if (!evidence || typeof evidence !== 'object' || Array.isArray(evidence)) return ['evidence must be an object'];
  if (!EVIDENCE_SOURCES.includes(evidence.source)) errors.push('evidence.source must be one of ' + EVIDENCE_SOURCES.join('/'));
  for (const key of ['checkedAt', 'host', 'checker', 'reportPath']) {
    if (!(key in evidence)) errors.push('evidence.' + key + ' is required (use null for declared)');
  }
  if (evidence.source === 'declared') {
    for (const key of ['checkedAt', 'host', 'checker', 'reportPath']) {
      if (evidence[key] !== null) errors.push('declared evidence must have ' + key + '=null');
    }
    return errors;
  }
  if (evidence.source === 'checked' || evidence.source === 'tested') {
    if (!isIsoInstant(evidence.checkedAt)) errors.push('checked/tested evidence.checkedAt must be an ISO-8601 UTC instant');
    if (typeof evidence.host !== 'string' || !/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(evidence.host)) {
      errors.push('checked/tested evidence.host must be a DSH host version');
    }
    if (typeof evidence.checker !== 'string' || !evidence.checker.trim()) errors.push('checked/tested evidence.checker must be non-empty');
    if (typeof evidence.reportPath !== 'string' || !evidence.reportPath.trim()) {
      errors.push('checked/tested evidence.reportPath must be non-empty');
    } else {
      const p = evidence.reportPath.replace(/\\/g, '/');
      if (p.startsWith('/') || /^[A-Za-z]:/.test(p)) errors.push('evidence.reportPath must be repository-relative');
      if (p.split('/').includes('..')) errors.push('evidence.reportPath must not escape the repository');
      if (p !== evidence.reportPath) errors.push('evidence.reportPath must use forward slashes');
    }
  }
  return errors;
}

// The checker's conclusion is a process verdict; HCB's entry state is an
// evidence state. Keep the translation in one place so a FAIL can never be
// silently rendered as a pass, and a PASS can never become `runtime`.
export function entryStatusFromReport(report) {
  const status = report?.conclusion?.status;
  const level = String(report?.conclusion?.level ?? '');
  if (status === 'fail') return 'failed';
  if (status === 'incomplete') return 'blocked';
  if (status === 'pass' || status === 'warn') {
    if (level.includes('DSH-ENTRY runtime')) return 'runtime';
    if (level.includes('DSH-ENTRY static')) return 'static';
    if (level.includes('DSH-ENTRY recognized')) return 'recognized';
  }
  return null;
}

export function checkerLabel(report, checkerVersion = '1.6.10') {
  const scanner = report?.anchor?.scanner;
  return `dsh-standards@${checkerVersion}${scanner ? ` (${scanner})` : ''}`;
}

export function evidenceFromReport({ report, checkedAt, reportPath, checkerVersion = '1.6.10', source = 'checked' }) {
  const host = report?.anchor?.dsh || report?.anchor?.hostVersion || null;
  return {
    source,
    checkedAt,
    host,
    checker: checkerLabel(report, checkerVersion),
    reportPath,
  };
}

// Used by the weekly collector: carry checked/tested evidence forward only for
// the exact same package version. A new version always falls back to declared.
export function carryForwardEvidence(standards, prior, version) {
  if (!prior || prior.version !== version || !prior.evidence || prior.evidence.source === 'declared') {
    return { standards, evidence: declaredEvidence() };
  }
  if (validateEvidence(prior.evidence).length) return { standards, evidence: declaredEvidence() };
  const priorStatus = prior.standards?.entry?.status;
  if (!ENTRY_STATUSES.includes(priorStatus) || priorStatus === 'unknown') {
    return { standards, evidence: declaredEvidence() };
  }
  const declaredStatus = standards.entry.status;
  const entry = { ...standards.entry, status: priorStatus };
  if (priorStatus !== declaredStatus) entry.declaredStatus = declaredStatus;
  return { standards: { ...standards, entry }, evidence: prior.evidence };
}

export function isDowngrade(previousStatus, nextStatus) {
  return (STATUS_RANK[nextStatus] ?? 0) < (STATUS_RANK[previousStatus] ?? 0);
}

// Recompute every summary bucket that is derived from rows. This is used after
// a merge so the headline counts cannot disagree with the edited row.
export function refreshSummary(matrix, updatedAt = new Date().toISOString()) {
  const rows = matrix.rows || [];
  const latestHost = matrix.latestHost;
  const count = (f) => rows.filter(f).length;
  const tally = (states, get) => Object.fromEntries([...states, 'unknown'].map(s => [s, count(r => get(r) === s)]));
  const bySource = { declared: 0, checked: 0, tested: 0 };
  for (const r of rows) {
    if (r.evidence && bySource[r.evidence.source] !== undefined) bySource[r.evidence.source]++;
  }
  matrix.summary = {
    ...(matrix.summary || {}),
    generatedAt: matrix.summary?.generatedAt || matrix.generatedAt,
    plugins: rows.length,
    compat: {
      compatible: count(r => r.hosts?.[latestHost] === 'declared-compatible'),
      incompatible: count(r => r.hosts?.[latestHost] === 'declared-incompatible'),
      unknown: count(r => !r.hosts?.[latestHost] || r.hosts[latestHost] === 'unknown'),
    },
    standardsDeclared: count(r => r.standards?.source !== 'not-declared'),
    entry: tally(ENTRY_STATUSES.slice(0, -1), r => r.standards?.entry?.status),
    flow: tally(['runtime', 'manual', 'not-run', 'failed', 'stale'], r => r.standards?.flow?.status),
    boost: tally(['measured', 'not-measured', 'failed', 'stale'], r => r.standards?.boost?.status),
    risk: tally(['low', 'medium', 'high'], r => r.risk?.level),
    gate: Object.fromEntries(['blocked', 'review', 'pilot', 'production-candidate'].map(s => [s, count(r => r.gate?.decision === s)])),
    evidence: bySource,
    evidenceUpdatedAt: updatedAt,
    latestHost,
  };
  matrix.evidenceUpdatedAt = updatedAt;
  matrix.schemaVersion = matrix.schemaVersion || '0.5';
  return matrix;
}

// Apply a merged patch to an in-memory matrix. Throws on any inconsistency so
// callers can validate before writing a single byte.
export function applyEvidencePatch(matrix, patch, { latestHost = matrix.latestHost } = {}) {
  if (!patch || patch.schema !== 'hcb-evidence-patch/1') throw new Error('not an hcb-evidence-patch/1 document');
  if (!Array.isArray(matrix.rows)) throw new Error('matrix.rows missing');
  const row = matrix.rows.find(r => r.name === patch.package);
  if (!row) throw new Error(`${patch.package} is not in the matrix; add it to data/plugins.seed.json first`);
  if (row.version !== patch.version) {
    throw new Error(`version mismatch: matrix has ${row.name}@${row.version}, patch is for @${patch.version}`);
  }
  if (!ENTRY_STATUSES.includes(patch.entryStatus)) throw new Error(`invalid entryStatus: ${patch.entryStatus}`);
  if (!patch.evidence || !['checked', 'tested'].includes(patch.evidence.source)) {
    throw new Error('merge requires checked/tested evidence (declared is not a check)');
  }
  const errors = validateEvidence(patch.evidence);
  if (errors.length) throw new Error('invalid evidence: ' + errors.join('; '));
  if (patch.reportPath && patch.evidence.reportPath !== patch.reportPath) throw new Error('patch.reportPath and evidence.reportPath differ');

  const previousStatus = row.standards?.entry?.status ?? 'unknown';
  const previousDeclared = row.standards?.entry?.declaredStatus ?? previousStatus;
  const wasChecked = row.evidence?.source !== undefined && row.evidence.source !== 'declared';
  const declaredStatus = wasChecked ? previousDeclared : previousStatus;
  const nextEntry = { ...(row.standards?.entry || {}) };
  nextEntry.status = patch.entryStatus;
  if (declaredStatus !== patch.entryStatus) nextEntry.declaredStatus = declaredStatus;
  else if (nextEntry.declaredStatus) delete nextEntry.declaredStatus;
  row.standards = { ...(row.standards || {}), entry: nextEntry };
  row.evidence = patch.evidence;
  row.gate = gateOf(row.hosts?.[latestHost] || 'unknown', row.standards, row.risk || { level: 'unknown', capabilities: [] });
  refreshSummary(matrix);
  return {
    row,
    previousStatus,
    nextStatus: patch.entryStatus,
    declaredStatus: nextEntry.declaredStatus ?? null,
    downgraded: isDowngrade(previousStatus, patch.entryStatus),
  };
}
