#!/usr/bin/env node
// HCB collector v0.5: declared compatibility + tracks + evidence + risk + gate.
// Usage: GITHUB_TOKEN=... node scripts/collect.mjs
import fs from 'node:fs';
import path from 'node:path';
import semver from 'semver';
import { carryForwardEvidence, refreshSummary } from './lib/evidence.mjs';
import { gateOf, riskOf } from './lib/gate.mjs';
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
const H = TOKEN ? { headers: { Authorization: 'Bearer ' + TOKEN, Accept: 'application/vnd.github+json', 'User-Agent': 'hcb-collector' } } : { headers: { 'User-Agent': 'hcb-collector' } };
const OUT = path.resolve('data');
const now = new Date().toISOString();
const j = async (u, o = {}) => { const r = await fetch(u, o); if (!r.ok) throw new Error(u + ' -> ' + r.status); return r.json(); };
const ENTRY = ['runtime','recognized','static','blocked','failed','not-run','stale'];
const FLOW = ['runtime','manual','not-run','failed','stale'];
const BOOST = ['measured','not-measured','failed','stale'];
const norm = (x, allowed) => { if (x == null) return { status: 'unknown', evidence: false }; if (typeof x === 'string') return { status: allowed.includes(x) ? x : 'unknown', evidence: false }; const s = x.status || 'unknown'; return { status: allowed.includes(s) ? s : 'unknown', evidence: !!x.evidence }; };

const releases = await j('https://api.github.com/repos/deepseek-ai/deepseek-harness/releases?per_page=100', H);
const hosts = releases.map(r => ({ tag: r.tag_name, version: r.tag_name.replace(/^dsh-v/, ''), publishedAt: r.published_at, prerelease: r.prerelease, url: r.html_url })).filter(h => semver.valid(h.version)).sort((a, b) => semver.rcompare(a.version, b.version));
const recentHosts = hosts.slice(0, 10);
const seed = JSON.parse(fs.readFileSync(path.join(OUT, 'plugins.seed.json'), 'utf8'));
// Preserve checked/tested evidence across weekly collection, but only for the
// exact same package version. A new version always resets to `declared`.
const previous = new Map();
try {
  const old = JSON.parse(fs.readFileSync(path.join(OUT, 'matrix.json'), 'utf8'));
  for (const r of old.rows || []) previous.set(r.name, r);
} catch {}
const plugins = [];
for (const name of seed.packages) {
  try {
    const reg = await j('https://registry.npmjs.org/' + encodeURIComponent(name));
    const latest = reg['dist-tags']?.latest; if (!latest) continue;
    const v = reg.versions?.[latest] || {};
    const range = v.engines?.dsh || v.peerDependencies?.['@deepseek-ai/dsh'] || null;
    const valid = range ? semver.validRange(range, { includePrerelease: true }) : null;
    let dl = null; try { const d = await j('https://api.npmjs.org/downloads/point/last-week/' + encodeURIComponent(name)); dl = d.downloads ?? null; } catch {}
    const std = v.dsh?.standards;
    let standards = { schema: std?.schema || null, source: std ? 'package.json#dsh.standards' : 'not-declared', entry: norm(std?.entry, ENTRY), flow: norm(std?.flow, FLOW), boost: norm(std?.boost, BOOST) };
    const prior = previous.get(name);
    const carried = carryForwardEvidence(standards, prior, latest);
    standards = carried.standards;
    const evidence = carried.evidence;
    const caps = Array.isArray(v.dsh?.capabilities) ? v.dsh.capabilities : [];
    plugins.push({ name, version: latest, declaredRange: range, rangeValid: !!valid, manifestVersion: v.dsh?.manifestVersion ?? null, capabilities: caps, repository: (v.repository && (v.repository.url || v.repository)) || null, publishedAt: reg.time?.[latest] || null, downloadsLastWeek: dl, standards, evidence, risk: riskOf(caps) });
  } catch {}
}
const rows = plugins.map(p => { const hostsMap = {}; for (const h of recentHosts) { let s = 'unknown'; if (p.rangeValid) s = semver.satisfies(h.version, p.declaredRange, { includePrerelease: true }) ? 'declared-compatible' : 'declared-incompatible'; hostsMap[h.version] = s; } const latestHost = recentHosts[0]?.version; const compat = hostsMap[latestHost] || 'unknown'; return { ...p, hosts: hostsMap, gate: gateOf(compat, p.standards, p.risk) }; });
const latestHost = recentHosts[0]?.version;
const cnt = (arr, f) => arr.filter(f).length;
const summary = {
  generatedAt: now, hosts: hosts.length, hostsRecent: recentHosts.length, plugins: plugins.length,
  compat: { compatible: cnt(rows, r => r.hosts[latestHost] === 'declared-compatible'), incompatible: cnt(rows, r => r.hosts[latestHost] === 'declared-incompatible'), unknown: cnt(rows, r => r.hosts[latestHost] === 'unknown') },
  standardsDeclared: cnt(rows, r => r.standards.source !== 'not-declared'),
  entry: Object.fromEntries(ENTRY.concat(['unknown']).map(s => [s, cnt(rows, r => r.standards.entry.status === s)])),
  flow: Object.fromEntries(FLOW.concat(['unknown']).map(s => [s, cnt(rows, r => r.standards.flow.status === s)])),
  boost: Object.fromEntries(BOOST.concat(['unknown']).map(s => [s, cnt(rows, r => r.standards.boost.status === s)])),
  risk: Object.fromEntries(['low','medium','high','unknown'].map(s => [s, cnt(rows, r => r.risk.level === s)])),
  gate: Object.fromEntries(['blocked','review','pilot','production-candidate'].map(s => [s, cnt(rows, r => r.gate.decision === s)])),
  evidence: { declared: cnt(rows, r => r.evidence.source === 'declared'), checked: cnt(rows, r => r.evidence.source === 'checked'), tested: cnt(rows, r => r.evidence.source === 'tested') },
  latestHost
};
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'hosts.json'), JSON.stringify({ generatedAt: now, hosts }, null, 2));
const matrix = { schemaVersion: '0.5', generatedAt: now, latestHost, summary, rows };
refreshSummary(matrix, now);
fs.writeFileSync(path.join(OUT, 'matrix.json'), JSON.stringify(matrix, null, 2));
fs.writeFileSync(path.join(OUT, 'tracks.json'), JSON.stringify({ generatedAt: now, declared: summary.standardsDeclared, entry: summary.entry, flow: summary.flow, boost: summary.boost, gate: summary.gate }, null, 2));
const capCount = {}; for (const r of rows) for (const c of r.capabilities) capCount[c] = (capCount[c] || 0) + 1;
fs.writeFileSync(path.join(OUT, 'capabilities.json'), JSON.stringify({ generatedAt: now, summary: { risk: summary.risk, capabilities: Object.fromEntries(Object.entries(capCount).sort((a,b)=>b[1]-a[1])) } }, null, 2));
console.log(JSON.stringify(summary, null, 2));
