#!/usr/bin/env node
// One-shot v0.4 -> v0.5 matrix migration.
//
// Adds the required `evidence` object to every row, marks the matrix as
// schemaVersion 0.5 and refreshes the derived summary counts. It does NOT
// invent checked evidence: every existing row is `declared` with null fields.
//
//   node scripts/migrate-v05.mjs --dry-run
//   node scripts/migrate-v05.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { declaredEvidence, refreshSummary, validateEvidence } from './lib/evidence.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const matrixArg = args.indexOf('--matrix');
const matrixPath = matrixArg >= 0 ? path.resolve(args[matrixArg + 1]) : path.join(REPO, 'data', 'matrix.json');
const backupArg = args.indexOf('--backup');
const backupPath = backupArg >= 0 ? path.resolve(args[backupArg + 1]) : path.join(path.dirname(matrixPath), 'matrix.v0.4.backup.json');

function fail(message) {
  console.error('migrate-v05: ' + message);
  process.exit(2);
}

if (!fs.existsSync(matrixPath)) fail(`missing ${matrixPath}`);
const matrix = JSON.parse(fs.readFileSync(matrixPath, 'utf8'));
if (!Array.isArray(matrix.rows)) fail(`${matrixPath} has no rows[]`);

let added = 0;
let kept = 0;
for (const row of matrix.rows) {
  if (row.evidence && validateEvidence(row.evidence).length === 0) {
    kept++;
    continue;
  }
  row.evidence = declaredEvidence();
  added++;
}

matrix.schemaVersion = '0.5';
refreshSummary(matrix);

if (dryRun) {
  console.log(JSON.stringify({ matrix: matrixPath, rows: matrix.rows.length, added, kept, dryRun: true, evidence: matrix.summary.evidence }, null, 2));
  process.exit(0);
}

if (!fs.existsSync(backupPath)) {
  fs.copyFileSync(matrixPath, backupPath, fs.constants.COPYFILE_EXCL);
  console.log(`backup: ${backupPath}`);
} else {
  console.log(`backup already exists (kept): ${backupPath}`);
}

const tmp = `${matrixPath}.tmp-${process.pid}-${Date.now()}`;
fs.writeFileSync(tmp, JSON.stringify(matrix, null, 2) + '\n');
try { fs.renameSync(tmp, matrixPath); }
catch {
  fs.copyFileSync(tmp, matrixPath);
  fs.unlinkSync(tmp);
}
console.log(JSON.stringify({ matrix: matrixPath, rows: matrix.rows.length, added, kept, schemaVersion: matrix.schemaVersion, evidence: matrix.summary.evidence }, null, 2));
