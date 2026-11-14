#!/usr/bin/env node
import fs from 'node:fs';
const d = JSON.parse(fs.readFileSync('data/matrix.json', 'utf8'));
if (!d.rows || !Array.isArray(d.rows)) throw new Error('rows missing');
const ok = new Set(['declared-compatible','declared-incompatible','unknown']);
for (const r of d.rows) { if (!r.name || !r.version) throw new Error('row missing name/version'); for (const [h, s] of Object.entries(r.hosts || {})) if (!ok.has(s)) throw new Error('bad status ' + s + ' for ' + r.name + '@' + h); }
console.log('OK', d.rows.length, 'rows; latestHost=' + d.latestHost);
