const pkg = process.env.INPUT_PACKAGE;
const hostInput = process.env.INPUT_HOST || 'latest';
const failOn = process.env.INPUT_FAIL_ON || 'declared-incompatible';
if (!pkg) { console.log('::error::package input is required'); process.exit(1); }
const urls = [
  'https://raw.githubusercontent.com/PerryLink/dsh-compat-baseline/main/data/matrix.json',
  'https://perrylink.github.io/dsh-compat-baseline/data/matrix.json'
];
let d = null;
for (const url of urls) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (res.ok) { d = await res.json(); break; }
  } catch {}
}
if (!d) { console.log('::warning::could not fetch HCB matrix'); process.exit(0); }
const row = d.rows.find(r => r.name === pkg);
if (!row) { console.log('::warning::' + pkg + ' is not in HCB; add it to data/plugins.seed.json'); process.exit(0); }
const host = hostInput === 'latest' ? d.latestHost : hostInput;
const status = row.hosts[host] || 'unknown';
console.log(`${pkg}@${row.version} vs DSH ${host}: ${status} (range: ${row.declaredRange || 'none'})`);
const t = row.standards || {}; const e = t.entry?.status || 'unknown'; const f = t.flow?.status || 'unknown'; const b = t.boost?.status || 'unknown';
console.log(`tracks: ENTRY=${e} FLOW=${f} BOOST=${b}; risk=${row.risk?.level || 'unknown'}; gate=${row.gate?.decision || 'unknown'}`);
if (failOn !== 'never' && status === failOn) {
  console.log(`::error::${pkg} is ${status} for DSH ${host}`);
  process.exit(1);
}
