#!/usr/bin/env node
import fs from 'node:fs';
const d = JSON.parse(fs.readFileSync('data/matrix.json', 'utf8'));
if (!Array.isArray(d.rows)) throw new Error('rows missing');
const compat = new Set(['declared-compatible','declared-incompatible','unknown']);
const entry = new Set(['runtime','recognized','static','blocked','failed','not-run','stale','unknown']);
const flow = new Set(['runtime','manual','not-run','failed','stale','unknown']);
const boost = new Set(['measured','not-measured','failed','stale','unknown']);
const risk = new Set(['low','medium','high','unknown']);
const gate = new Set(['blocked','review','pilot','production-candidate']);
for (const r of d.rows) {
  if (!r.name || !r.version) throw new Error('row missing name/version');
  for (const [h, s] of Object.entries(r.hosts || {})) if (!compat.has(s)) throw new Error('bad compat ' + s + ' ' + r.name + '@' + h);
  if (!r.standards || !entry.has(r.standards.entry.status) || !flow.has(r.standards.flow.status) || !boost.has(r.standards.boost.status)) throw new Error('bad tracks ' + r.name);
  if (!risk.has(r.risk.level) || !gate.has(r.gate.decision)) throw new Error('bad risk/gate ' + r.name);
}
console.log('OK', d.rows.length, 'rows; latestHost=' + d.latestHost, 'gate=' + JSON.stringify(d.summary.gate));
