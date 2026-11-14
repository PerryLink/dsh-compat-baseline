#!/usr/bin/env node
// HCB collector v0.2: declared compatibility + ENTRY/FLOW/BOOST tracks + risk + gate.
// Usage: GITHUB_TOKEN=... node scripts/collect.mjs
import fs from 'node:fs';
import path from 'node:path';
import semver from 'semver';
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
const H = TOKEN ? { headers: { Authorization: 'Bearer ' + TOKEN, Accept: 'application/vnd.github+json', 'User-Agent': 'hcb-collector' } } : { headers: { 'User-Agent': 'hcb-collector' } };
const OUT = path.resolve('data');
const now = new Date().toISOString();
const j = async (u, o = {}) => { const r = await fetch(u, o); if (!r.ok) throw new Error(u + ' -> ' + r.status); return r.json(); };
const ENTRY = ['runtime','recognized','static','blocked','failed','not-run','stale'];
const FLOW = ['runtime','manual','not-run','failed','stale'];
const BOOST = ['measured','not-measured','failed','stale'];
const norm = (x, allowed) => { if (x == null) return { status: 'unknown', evidence: false }; if (typeof x === 'string') return { status: allowed.includes(x) ? x : 'unknown', evidence: false }; const s = x.status || 'unknown'; return { status: allowed.includes(s) ? s : 'unknown', evidence: !!x.evidence }; };
const riskOf = (caps) => { const high = caps.filter(c => /subprocess|fs:write|shell|exec|listen|process|danger/i.test(c)); const med = caps.filter(c => /network:egress|fs:read|sessions:read|tools:register|client:/i.test(c)); const level = high.length ? 'high' : med.length ? 'medium' : caps.length ? 'low' : 'unknown'; const reasons = []; if (high.length) reasons.push('high-capability: ' + high.join(', ')); if (med.length) reasons.push('medium-capability: ' + med.join(', ')); if (!caps.length) reasons.push('no capability manifest'); return { level, capabilities: caps, reasons }; };
const gateOf = (compat, standards, risk) => { const reasons = []; if (compat === 'declared-incompatible') return { decision: 'blocked', reasons: ['declared range excludes latest host'] }; if (['failed','blocked'].includes(standards.entry.status)) return { decision: 'blocked', reasons: ['ENTRY ' + standards.entry.status] }; if (compat === 'unknown') return { decision: 'review', reasons: ['no declared DSH range'] }; if (risk.level === 'high') return { decision: 'review', reasons: ['high-capability surface: ' + risk.capabilities.join(', ')] }; if (standards.entry.status === 'runtime' && ['runtime','manual'].includes(standards.flow.status) && ['low','medium'].includes(risk.level)) return { decision: 'production-candidate', reasons: ['compat + ENTRY runtime + FLOW ' + standards.flow.status + ' + risk ' + risk.level] }; const r = ['compatible, but unverified']; if (standards.entry.status === 'unknown') r.push('no dsh.standards declaration'); else r.push('ENTRY ' + standards.entry.status + ', FLOW ' + standards.flow.status); return { decision: 'pilot', reasons: r }; };

const releases = await j('https://api.github.com/repos/deepseek-ai/deepseek-harness/releases?per_page=100', H);
const hosts = releases.map(r => ({ tag: r.tag_name, version: r.tag_name.replace(/^dsh-v/, ''), publishedAt: r.published_at, prerelease: r.prerelease, url: r.html_url })).filter(h => semver.valid(h.version)).sort((a, b) => semver.rcompare(a.version, b.version));
const recentHosts = hosts.slice(0, 10);
const seed = JSON.parse(fs.readFileSync(path.join(OUT, 'plugins.seed.json'), 'utf8'));
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
    const standards = { schema: std?.schema || null, source: std ? 'package.json#dsh.standards' : 'not-declared', entry: norm(std?.entry, ENTRY), flow: norm(std?.flow, FLOW), boost: norm(std?.boost, BOOST) };
    const caps = Array.isArray(v.dsh?.capabilities) ? v.dsh.capabilities : [];
    plugins.push({ name, version: latest, declaredRange: range, rangeValid: !!valid, manifestVersion: v.dsh?.manifestVersion ?? null, capabilities: caps, repository: (v.repository && (v.repository.url || v.repository)) || null, publishedAt: reg.time?.[latest] || null, downloadsLastWeek: dl, standards, risk: riskOf(caps) });
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
  latestHost
};
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'hosts.json'), JSON.stringify({ generatedAt: now, hosts }, null, 2));
fs.writeFileSync(path.join(OUT, 'matrix.json'), JSON.stringify({ generatedAt: now, latestHost, summary, rows }, null, 2));
fs.writeFileSync(path.join(OUT, 'tracks.json'), JSON.stringify({ generatedAt: now, declared: summary.standardsDeclared, entry: summary.entry, flow: summary.flow, boost: summary.boost, gate: summary.gate }, null, 2));
const capCount = {}; for (const r of rows) for (const c of r.capabilities) capCount[c] = (capCount[c] || 0) + 1;
fs.writeFileSync(path.join(OUT, 'capabilities.json'), JSON.stringify({ generatedAt: now, summary: { risk: summary.risk, capabilities: Object.fromEntries(Object.entries(capCount).sort((a,b)=>b[1]-a[1])) } }, null, 2));
console.log(JSON.stringify(summary, null, 2));
