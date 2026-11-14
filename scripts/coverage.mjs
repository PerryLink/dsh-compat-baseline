#!/usr/bin/env node
// Coverage of the HCB matrix against the canonical PerryLink family roster.
// Usage: node scripts/coverage.mjs [--json] [--write]
import fs from 'node:fs';
const roster = JSON.parse(fs.readFileSync('data/roster.json', 'utf8')).packages;
const matrix = JSON.parse(fs.readFileSync('data/matrix.json', 'utf8'));
const byName = new Map(matrix.rows.map(r => [r.name, r]));
const order = ['mainline-default','mainline-opt-in','catalog-only','domain','external'];
const groups = {};
for (const p of roster) {
  const g = p.group || 'external';
  groups[g] ??= { total: 0, covered: 0, declaredTracks: 0, compatDeclared: 0, gate: {} , missing: [] };
  groups[g].total++;
  const row = byName.get(p.name);
  if (row) {
    groups[g].covered++;
    if (row.standards.source !== 'not-declared') groups[g].declaredTracks++;
    if (row.hosts[matrix.latestHost] === 'declared-compatible') groups[g].compatDeclared++;
    groups[g].gate[row.gate.decision] = (groups[g].gate[row.gate.decision] || 0) + 1;
  } else groups[g].missing.push(p.name);
}
const out = { generatedAt: new Date().toISOString(), matrix: matrix.rows.length, roster: roster.length, groups: Object.fromEntries(order.filter(g => groups[g]).map(g => [g, groups[g]])) };
if (process.argv.includes('--json')) console.log(JSON.stringify(out, null, 2));
else {
  console.log('group'.padEnd(18), 'total', 'covered', 'missing', 'tracks', 'compat', 'gate');
  for (const g of order.filter(g => groups[g])) {
    const x = groups[g];
    console.log(g.padEnd(18), String(x.total).padStart(5), String(x.covered).padStart(7), String(x.total - x.covered).padStart(7), String(x.declaredTracks).padStart(6), String(x.compatDeclared).padStart(6), JSON.stringify(x.gate));
  }
}
if (process.argv.includes('--write')) fs.writeFileSync('data/coverage.json', JSON.stringify(out, null, 2));
