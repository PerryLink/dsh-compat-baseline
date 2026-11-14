> **HCB is the data/gate subproject of [dsh-standards](https://github.com/PerryLink/dsh-standards).**
> Rules, checker and ENTRY/FLOW/BOOST definitions live in dsh-standards. This repo holds the compatibility matrix, tracks data, the v0.5 evidence layer, risk and `hcb-gate/1`.
> Independent community project. **Not affiliated with DeepSeek.**

**Official:** [GitHub (canonical)](https://github.com/PerryLink/dsh-hcb) · [npm](https://www.npmjs.com/package/dsh-hcb) · [Gitee mirror](https://gitee.com/perrylink/dsh-hcb) · [GitCode mirror](https://gitcode.com/PerryLink/dsh-hcb)

```bash
npx dsh-hcb check dsh-auto-review
```

# HCB — Host Compatibility Baseline for DeepSeek Harness plugins

> **Declared** compatibility + **declared** adoption tracks, with an explicit
> `declared / checked / tested` evidence layer. Not a score, not a certification,
> and not a runtime guarantee.
> Independent community project. **Not affiliated with DeepSeek.**

DSH ships fast and breaks compatibility often. Plugin authors and enterprise buyers have no single place to answer:

- Which DSH versions does this plugin *declare* support?
- Does it declare **DSH-ENTRY / DSH-FLOW / DSH-BOOST** status — and with what evidence?
- Has anybody independently **checked** the published tarball, or is the row still only a claim?
- What capability surface does it request?
- Is it ready to pilot, or does it need review first?

HCB answers these from package metadata (`engines.dsh`, `peerDependencies`, `dsh.capabilities`, `dsh.standards`), DSH GitHub releases, and — for rows that have been audited — a stored checker report.

## Three tracks, not three levels

HCB follows the [dsh-standards](https://github.com/PerryLink/dsh-standards) model. **ENTRY / FLOW / BOOST are independent tracks; they are never summed into a score.**

| Track | Question | Gates | Evidence states |
|---|---|---|---|
| **DSH-ENTRY** | can it be recognized, installed, booted? | G0–G5 | runtime / recognized / static / blocked / failed / not-run / stale |
| **DSH-FLOW** | can a user install, configure, use, recover, uninstall? | J1–J8 | runtime / manual / not-run / failed / stale |
| **DSH-BOOST** | does it use Cordis natively and efficiently? | LEV-1–8 | measured / not-measured / failed / stale |

Rules: **a skip is not a pass**; `static` is not `runtime`; **BOOST is not a gate**; compatibility is a claim by the package author, not a test result. See [docs/TRACKS.md](docs/TRACKS.md).

## What is in v0.8.2 (schema v0.5)

| File | Meaning |
|---|---|
| `data/hosts.json` | DSH releases (tag → version → date) |
| `data/matrix.json` | plugin × host compatibility **plus** `standards` tracks, `evidence`, `risk`, and `gate` |
| `data/tracks.json` | counts per ENTRY/FLOW/BOOST state and gate decision |
| `data/capabilities.json` | capability / risk aggregation |
| `spec/tracks.json` | HCB's consumer mapping of `dsh-levels/1` |
| `schema/hcb.schema.json` | JSON Schema (v0.5) for the data format |
| `data/roster.json` | canonical dsh-kit family roster (112) + external |
| `data/coverage.json` | coverage vs roster |
| `scripts/coverage.mjs` | reproducibility check |
| `scripts/collect.mjs` | reproducible collector; preserves checked evidence for the same version |
| `scripts/audit-entry.mjs` | **v0.5**: pack + static ENTRY check -> evidence patch (optional `--merge`) |
| `scripts/migrate-v05.mjs` | one-shot v0.4 -> v0.5 matrix migration |
| `scripts/validate.mjs` | validates the matrix, evidence, summary and gate |
| `docs/EVIDENCE.md` | evidence contract and re-run guide |
| `.github/actions/check` | drop-in CI check |
| `index.html` | static viewer (GitHub Pages) |

**Evidence levels**:

| Level | Produced by | Proves |
|---|---|---|
| `declared` | npm metadata / `package.json#dsh.standards` | the author's claim only |
| `checked` | `scripts/audit-entry.mjs` -> `dsh-standards@1.6.10 --scope entry --entry-claim static` | the published tarball was statically examined; **no boot** |
| `tested` | a real DSH host boot (ENTRY G0–G3; future harness) | runtime behaviour was observed |

v0.5 ships the `declared` and `checked` machinery. `tested` is defined but is
not produced by `audit-entry.mjs`; the script is intentionally static-only.
See [`docs/EVIDENCE.md`](docs/EVIDENCE.md) for the field contract, failure /
blocked semantics, and the exact re-run commands.

## Current coverage (2026-11-14, v0.8.2)

- **143 plugins** = the full 112-package dsh-kit family (34 mainline-default + 53 opt-in + 10 catalog-only + 15 domain) + 31 external
- **123** declare `engines.dsh`; **20** are `unknown`
- **5** declare `dsh.standards`; **138** are `not-declared`
- ENTRY: **95 `recognized` + 1 `failed` (96 checked)**, 0 `not-run`, 47 `unknown` — **no plugin has runtime evidence yet**
- FLOW: **2 `manual` + 3 `not-run` + 138 `unknown`** — `manual` is not `runtime`; no plugin has a runtime FLOW claim
- Evidence: **47 `declared`, 96 `checked`, 0 `tested`** (96 merged from static checker; no boot). **All 34 mainline-default rows are `checked`**, plus **all 53 mainline-opt-in** (finished in v0.8.0), **2 of 10 catalog-only** (new in v0.8.0) and 7 external rows.
- Risk: 3 high, 63 medium, 77 unknown (no capability manifest)
- Gate: 1 `blocked` (`dsh-checkers`' `failed` ENTRY), 22 `review`, 120 `pilot`, 0 `production-candidate`

> The near-zero `dsh.standards` adoption is itself a finding. The gate is a **compatibility/risk heuristic**, not a quality grade.


## Coverage vs canonical roster (2026-11-14)

HCB is measured against the canonical `dsh-kit` family roster (112 packages), not an ad-hoc list:

| Group | Total | Covered by HCB | Checked | Missing | Declared tracks | Compat declared |
|---|---:|---:|---:|---:|---:|---:|
| mainline-default | 34 | 34 | 34 | 0 | 5 | 34 |
| mainline-opt-in | 53 | 53 | 53 | 0 | 0 | 53 |
| catalog-only | 10 | 10 | 2 | 0 | 0 | 10 |
| domain | 15 | 15 | 0 | 0 | 0 | 15 |
| external | 31 | 31 | 7 | 0 | 0 | 11 |

**112 / 112 family packages (100%) are covered**, plus 31 external plugins. Coverage is complete, but **evidence is not**: only 5 plugins declare tracks, and 0 have ENTRY runtime. v0.6.0 added the static `checked` pipeline for the whole mainline-default set (34/34); v0.7.0 started mainline-opt-in (19/53); v0.8.0 finishes all 53 opt-in rows and adds the first 2 catalog-only rows (96 checked overall); v0.8.2 refreshes three changed package versions, keeps `checked` at 96, re-audits `dsh-permission-rules` with the 16-ID checker 1.7.0 (restoring `recognized`), and adds FLOW `manual` evidence for two of them. The remaining 8 catalog-only, 15 domain and 24 external rows, plus a runtime `tested` matrix, remain future work.

Run `npm run coverage` to reproduce; `data/coverage.json` is the machine-readable result.

## CLI

```bash
node scripts/hcb-cli.mjs check dsh-auto-review
node scripts/badge.mjs dsh-auto-review > badge.svg

# v0.5 evidence audit (dry run by default)
node scripts/audit-entry.mjs dsh-plugin-guide
node scripts/audit-entry.mjs dsh-plugin-guide --merge   # review the patch first
npm run validate
npm test
```

## Quick start

```bash
npm install
npm run collect   # needs GITHUB_TOKEN for higher rate limits
npm run validate
python3 -m http.server 8080   # open index.html
```

## Use in CI

```yaml
- uses: PerryLink/dsh-hcb/.github/actions/check@main
  with:
    package: your-npm-package
```

It prints compatibility + tracks + gate; fails only on `declared-incompatible` by default. See [docs/CI.md](docs/CI.md).

## How to add a plugin

1. Add the npm package name to `data/plugins.seed.json`.
2. Run `npm run collect`.
3. Optional but encouraged: run `node scripts/audit-entry.mjs <package>` and,
   after reviewing the patch, `--merge`; commit the raw report under `evidence/`.
4. Open a PR with the regenerated `data/*.json`, the evidence report/patch, and
   the reason. A checked row must include its `reportPath`.

## What this is not

- Not a security audit. Declared capabilities ≠ actual behavior.
- Not a runtime test. `checked` is a static tarball check; only `tested` means a host booted it.
- Not a ranking. No total score; ENTRY/FLOW/BOOST are separate.
- Not a certification. `production-candidate` only means HCB found no blocker in the checks it knows.
- Not official. Do not use the DeepSeek name/logo to imply endorsement.

## Roadmap

- **v0.4** full 112-package family coverage + three tracks + risk/gate.
- **v0.5** evidence layer: `declared` / `checked` / `tested`, static audit pipeline, patches.
- **v0.6** full mainline-default static `checked` coverage (34/34; 41 checked overall); runtime `tested` matrix, capability diff and stale alerts remain future work.
- **v0.7** first 19 of 53 mainline-opt-in rows statically `checked` (60 checked overall).
- **v0.8** finish mainline-opt-in (53/53) and add the first 2 of 10 catalog-only rows statically `checked` (96 checked overall); the remaining 8 catalog-only, 15 domain and 24 external rows plus runtime `tested` remain future work.
- **v0.8.1** refresh `dsh-auto-review@0.15.2`, `dsh-permission-rules@0.8.1` and `dsh-plugin-guide@0.5.9` from npm; re-audit all three (`checked` stays 96); hold `dsh-permission-rules` ENTRY `blocked` until a 16-ID checker can validate `sessions:write`; record FLOW `manual` for auto-review and permission-rules (never `runtime`).
- **v1.0** stable schema + CI action + weekly refresh + DOI.

## License

MIT (code and data). See `LICENSE`. The track model is Apache-2.0 from dsh-standards; see `NOTICE.md`.
