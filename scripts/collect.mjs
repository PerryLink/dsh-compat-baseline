#!/usr/bin/env node
// HCB collector: declared compatibility from npm + DSH GitHub releases.
// Usage: GITHUB_TOKEN=... node scripts/collect.mjs
import fs from 'node:fs';
import path from 'node:path';
import semver from 'semver';
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
const H = TOKEN ? { headers: { Authorization: 'Bearer ' + TOKEN, Accept: 'application/vnd.github+json', 'User-Agent': 'hcb-collector' } } : { headers: { 'User-Agent': 'hcb-collector' } };
const OUT = path.resolve('data');
const now = new Date().toISOString();
const j = async (u, o = {}) => { const r = await fetch(u, o); if (!r.ok) throw new Error(u + ' -> ' + r.status); return r.json(); };
const releases = await j('https://api.github.com/repos/deepseek-ai/deepseek-harness/releases?per_page=100', H);
const hosts = releases.map(r => ({ tag: r.tag_name, version: r.tag_name.replace(/^dsh-v/, ''), publishedAt: r.published_at, prerelease: r.prerelease, url: r.html_url }))
  .filter(h => semver.valid(h.version)).sort((a, b) => semver.rcompare(a.version, b.version));
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
    plugins.push({ name, version: latest, declaredRange: range, rangeValid: !!valid, manifestVersion: v.dsh?.manifestVersion ?? null, capabilities: Array.isArray(v.dsh?.capabilities) ? v.dsh.capabilities : [], repository: (v.repository && (v.repository.url || v.repository)) || null, publishedAt: reg.time?.[latest] || null, downloadsLastWeek: dl });
  } catch {}
}
const rows = plugins.map(p => { const hostsMap = {}; for (const h of recentHosts) { let s = 'unknown'; if (p.rangeValid) s = semver.satisfies(h.version, p.declaredRange, { includePrerelease: true }) ? 'declared-compatible' : 'declared-incompatible'; hostsMap[h.version] = s; } return { ...p, hosts: hostsMap }; });
const capCount = {}; for (const p of plugins) for (const c of p.capabilities) capCount[c] = (capCount[c] || 0) + 1;
const latestHost = recentHosts[0]?.version;
const summary = { generatedAt: now, hosts: hosts.length, hostsRecent: recentHosts.length, plugins: plugins.length, declaredRange: plugins.filter(p => p.rangeValid).length, unknownRange: plugins.filter(p => !p.rangeValid).length, compatibleWithLatest: rows.filter(p => p.hosts[latestHost] === 'declared-compatible').length, capabilityCounts: Object.fromEntries(Object.entries(capCount).sort((a, b) => b[1] - a[1])), latestHost };
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'hosts.json'), JSON.stringify({ generatedAt: now, hosts }, null, 2));
fs.writeFileSync(path.join(OUT, 'matrix.json'), JSON.stringify({ generatedAt: now, latestHost, summary, rows }, null, 2));
fs.writeFileSync(path.join(OUT, 'capabilities.json'), JSON.stringify({ generatedAt: now, capabilityCounts: summary.capabilityCounts }, null, 2));
console.log(JSON.stringify(summary, null, 2));
