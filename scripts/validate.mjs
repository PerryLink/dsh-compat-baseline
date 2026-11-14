#!/usr/bin/env node
// Validate the HCB matrix, including the v0.5 evidence layer.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ENTRY_STATUSES, refreshSummary, validateEvidence } from './lib/evidence.mjs';
import { gateOf } from './lib/gate.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MATRIX = path.join(REPO, 'data', 'matrix.json');
const matrix = JSON.parse(fs.readFileSync(MATRIX, 'utf8'));
const compatStates = new Set(['declared-compatible', 'declared-incompatible', 'unknown']);
const flowStates = new Set(['runtime', 'manual', 'not-run', 'failed', 'stale', 'unknown']);
const boostStates = new Set(['measured', 'not-measured', 'failed', 'stale', 'unknown']);
const riskStates = new Set(['low', 'medium', 'high', 'unknown']);
const gateStates = new Set(['blocked', 'review', 'pilot', 'production-candidate']);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(Array.isArray(matrix.rows), 'rows missing');
assert(matrix.schemaVersion === '0.5', `schemaVersion must be "0.5" (got ${JSON.stringify(matrix.schemaVersion)})`);
assert(typeof matrix.latestHost === 'string' && matrix.latestHost, 'latestHost missing');
const names = new Set();
for (const r of matrix.rows) {
  assert(r.name && r.version, 'row missing name/version');
  assert(!names.has(r.name), `duplicate row: ${r.name}`);
  names.add(r.name);
  for (const [h, s] of Object.entries(r.hosts || {})) assert(compatStates.has(s), `bad compat ${s} ${r.name}@${h}`);
  assert(r.standards && ENTRY_STATUSES.includes(r.standards.entry?.status), `bad ENTRY status ${r.name}: ${r.standards?.entry?.status}`);
  assert(flowStates.has(r.standards.flow?.status), `bad FLOW status ${r.name}: ${r.standards.flow?.status}`);
  assert(boostStates.has(r.standards.boost?.status), `bad BOOST status ${r.name}: ${r.standards.boost?.status}`);
  if (r.standards.entry.declaredStatus !== undefined) {
    assert(ENTRY_STATUSES.includes(r.standards.entry.declaredStatus), `bad declaredStatus ${r.name}: ${r.standards.entry.declaredStatus}`);
  }
  assert(riskStates.has(r.risk?.level), `bad risk level ${r.name}`);
  assert(gateStates.has(r.gate?.decision), `bad gate decision ${r.name}`);

  const evidenceErrors = validateEvidence(r.evidence);
  assert(!evidenceErrors.length, `bad evidence ${r.name}: ${evidenceErrors.join('; ')}`);
  if (r.evidence.source === 'checked') {
    assert(r.standards.entry.status !== 'runtime', `checked evidence cannot establish ENTRY runtime (${r.name}); runtime requires tested evidence`);
  }
  if (r.evidence.source !== 'declared') {
    const report = path.join(REPO, r.evidence.reportPath);
    assert(fs.existsSync(report), `evidence report missing for ${r.name}: ${r.evidence.reportPath}`);
  }

  const compat = r.hosts?.[matrix.latestHost] || 'unknown';
  const expected = gateOf(compat, r.standards, r.risk);
  assert(expected.decision === r.gate.decision, `gate mismatch ${r.name}: stored=${r.gate.decision}, expected=${expected.decision}`);
}

assert(matrix.summary?.plugins === matrix.rows.length, `summary.plugins ${matrix.summary?.plugins} != rows ${matrix.rows.length}`);
const clone = JSON.parse(JSON.stringify(matrix));
refreshSummary(clone);
for (const key of ['entry', 'flow', 'boost', 'risk', 'gate', 'evidence', 'compat']) {
  assert(JSON.stringify(clone.summary[key]) === JSON.stringify(matrix.summary[key]), `summary.${key} is stale`);
}
assert(clone.summary.standardsDeclared === matrix.summary.standardsDeclared, 'summary.standardsDeclared is stale');

console.log('OK', matrix.rows.length, 'rows; latestHost=' + matrix.latestHost, 'evidence=' + JSON.stringify(matrix.summary.evidence), 'gate=' + JSON.stringify(matrix.summary.gate));
