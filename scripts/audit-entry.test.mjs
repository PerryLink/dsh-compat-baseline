import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyEvidencePatch,
  carryForwardEvidence,
  declaredEvidence,
  entryStatusFromReport,
  isIsoInstant,
  validateEvidence,
} from './lib/evidence.mjs';

const checkedEvidence = (overrides = {}) => ({
  source: 'checked',
  checkedAt: '2026-11-14T09:00:00.000Z',
  host: '0.2.2-rc.3',
  checker: 'dsh-standards@1.6.10 (dsh-plugin-verify@0.1.0)',
  reportPath: 'evidence/example/1.0.0/0.2.2-rc.3/2026-11-14T09-00-00-000Z/report.json',
  ...overrides,
});

function sampleMatrix() {
  return {
    schemaVersion: '0.5',
    latestHost: '0.2.2-rc.3',
    summary: { generatedAt: '2026-11-14T00:00:00.000Z' },
    rows: [{
      name: 'example',
      version: '1.0.0',
      hosts: { '0.2.2-rc.3': 'declared-compatible' },
      standards: {
        schema: 'dsh-levels/1',
        source: 'package.json#dsh.standards',
        entry: { status: 'not-run', evidence: false },
        flow: { status: 'not-run', evidence: false },
        boost: { status: 'not-measured', evidence: false },
      },
      risk: { level: 'low', capabilities: [], reasons: [] },
      gate: { decision: 'pilot', reasons: [] },
      evidence: declaredEvidence(),
    }],
  };
}

test('declared evidence is null-filled and valid', () => {
  const evidence = declaredEvidence();
  assert.deepEqual(evidence, { source: 'declared', checkedAt: null, host: null, checker: null, reportPath: null });
  assert.deepEqual(validateEvidence(evidence), []);
});

test('checked evidence requires a real report path and ISO instant', () => {
  assert.deepEqual(validateEvidence(checkedEvidence()), []);
  assert.match(validateEvidence(checkedEvidence({ checkedAt: '2026-11-14' })).join(' '), /ISO-8601/);
  assert.match(validateEvidence(checkedEvidence({ reportPath: '/tmp/report.json' })).join(' '), /repository-relative/);
  assert.match(validateEvidence(checkedEvidence({ reportPath: 'evidence/../report.json' })).join(' '), /must not escape/);
  assert.match(validateEvidence(checkedEvidence({ host: 'latest' })).join(' '), /host version/);
});

test('pass/warn map to recognized, fail to failed, incomplete to blocked', () => {
  assert.equal(entryStatusFromReport({ conclusion: { status: 'pass', level: 'DSH-ENTRY recognized' } }), 'recognized');
  assert.equal(entryStatusFromReport({ conclusion: { status: 'warn', level: 'DSH-ENTRY recognized (warnings)' } }), 'recognized');
  assert.equal(entryStatusFromReport({ conclusion: { status: 'fail', level: null } }), 'failed');
  assert.equal(entryStatusFromReport({ conclusion: { status: 'incomplete', level: 'DSH-ENTRY recognized' } }), 'blocked');
  assert.equal(entryStatusFromReport({ conclusion: { status: 'pass', level: null } }), null);
});

test('a static claim can never be read as runtime', () => {
  assert.equal(entryStatusFromReport({ conclusion: { status: 'pass', level: 'DSH-ENTRY recognized' } }), 'recognized');
  assert.notEqual(entryStatusFromReport({ conclusion: { status: 'pass', level: 'DSH-ENTRY recognized' } }), 'runtime');
});

test('merge applies checked evidence, preserves the declared claim and recomputes the gate', () => {
  const matrix = sampleMatrix();
  const patch = {
    schema: 'hcb-evidence-patch/1',
    package: 'example',
    version: '1.0.0',
    entryStatus: 'recognized',
    reportPath: checkedEvidence().reportPath,
    evidence: checkedEvidence(),
  };
  const result = applyEvidencePatch(matrix, patch);
  const row = matrix.rows[0];
  assert.equal(row.standards.entry.status, 'recognized');
  assert.equal(row.standards.entry.declaredStatus, 'not-run');
  assert.equal(row.evidence.source, 'checked');
  assert.equal(row.gate.decision, 'pilot');
  assert.equal(result.downgraded, false);
  assert.equal(matrix.summary.evidence.checked, 1);
  assert.equal(matrix.summary.entry.recognized, 1);
  assert.equal(matrix.summary.entry['not-run'], 0);
});

test('merge refuses a version mismatch and refuses declared-as-checked', () => {
  const matrix = sampleMatrix();
  const patch = {
    schema: 'hcb-evidence-patch/1',
    package: 'example',
    version: '2.0.0',
    entryStatus: 'recognized',
    evidence: checkedEvidence(),
    reportPath: checkedEvidence().reportPath,
  };
  assert.throws(() => applyEvidencePatch(matrix, patch), /version mismatch/);
  patch.version = '1.0.0';
  patch.evidence = declaredEvidence();
  assert.throws(() => applyEvidencePatch(matrix, patch), /checked\/tested evidence/);
});

test('a checked failure overrides a declared runtime but keeps it as declaredStatus', () => {
  const matrix = sampleMatrix();
  matrix.rows[0].standards.entry.status = 'runtime';
  const result = applyEvidencePatch(matrix, {
    schema: 'hcb-evidence-patch/1',
    package: 'example',
    version: '1.0.0',
    entryStatus: 'failed',
    evidence: checkedEvidence(),
    reportPath: checkedEvidence().reportPath,
  });
  assert.equal(matrix.rows[0].standards.entry.status, 'failed');
  assert.equal(matrix.rows[0].standards.entry.declaredStatus, 'runtime');
  assert.equal(result.downgraded, true);
  assert.equal(matrix.rows[0].gate.decision, 'blocked');
});

test('ISO helper rejects non-canonical timestamps', () => {
  assert.equal(isIsoInstant('2026-11-14T09:00:00.000Z'), true);
  assert.equal(isIsoInstant('2026-11-14T09:00:00Z'), false);
  assert.equal(isIsoInstant('not-a-date'), false);
});

test('collector carries checked evidence only for the exact same version', () => {
  const standards = {
    entry: { status: 'not-run', evidence: false },
    flow: { status: 'not-run', evidence: false },
    boost: { status: 'not-measured', evidence: false },
  };
  const prior = {
    version: '1.0.0',
    standards: { entry: { status: 'recognized', evidence: false } },
    evidence: checkedEvidence(),
  };
  const carried = carryForwardEvidence(standards, prior, '1.0.0');
  assert.equal(carried.standards.entry.status, 'recognized');
  assert.equal(carried.standards.entry.declaredStatus, 'not-run');
  assert.equal(carried.evidence.source, 'checked');

  const bumped = carryForwardEvidence(standards, prior, '1.0.1');
  assert.equal(bumped.standards.entry.status, 'not-run');
  assert.equal(bumped.evidence.source, 'declared');
  assert.equal(bumped.standards.entry.declaredStatus, undefined);
});

test('collector drops invalid prior evidence instead of laundering it', () => {
  const standards = { entry: { status: 'not-run', evidence: false }, flow: { status: 'not-run', evidence: false }, boost: { status: 'not-measured', evidence: false } };
  const prior = { version: '1.0.0', standards: { entry: { status: 'recognized' } }, evidence: checkedEvidence({ reportPath: '/tmp/x.json' }) };
  const carried = carryForwardEvidence(standards, prior, '1.0.0');
  assert.equal(carried.evidence.source, 'declared');
  assert.equal(carried.standards.entry.status, 'not-run');
});
