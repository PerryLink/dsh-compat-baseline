# HCB — Host Compatibility Baseline for DeepSeek Harness plugins

> **Declared** compatibility + **declared** adoption tracks, not tested compatibility and not a score.
> Independent community project. **Not affiliated with DeepSeek.**

DSH ships fast and breaks compatibility often. Plugin authors and enterprise buyers have no single place to answer:

- Which DSH versions does this plugin *declare* support?
- Does it declare **DSH-ENTRY / DSH-FLOW / DSH-BOOST** status — and with what evidence?
- What capability surface does it request?
- Is it ready to pilot, or does it need review first?

HCB answers these from package metadata (`engines.dsh`, `peerDependencies`, `dsh.capabilities`, `dsh.standards`) and DSH GitHub releases.

## Three tracks, not three levels

HCB follows the [dsh-standards](https://github.com/PerryLink/dsh-standards) model. **ENTRY / FLOW / BOOST are independent tracks; they are never summed into a score.**

| Track | Question | Gates | Evidence states |
|---|---|---|---|
| **DSH-ENTRY** | can it be recognized, installed, booted? | G0–G5 | runtime / recognized / static / blocked / failed / not-run / stale |
| **DSH-FLOW** | can a user install, configure, use, recover, uninstall? | J1–J8 | runtime / manual / not-run / failed / stale |
| **DSH-BOOST** | does it use Cordis natively and efficiently? | LEV-1–8 | measured / not-measured / failed / stale |

Rules: **a skip is not a pass**; `static` is not `runtime`; **BOOST is not a gate**; compatibility is a claim by the package author, not a test result. See [docs/TRACKS.md](docs/TRACKS.md).

## What is in v0.2

| File | Meaning |
|---|---|
| `data/hosts.json` | DSH releases (tag → version → date) |
| `data/matrix.json` | plugin × host compatibility **plus** `standards` tracks, `risk`, and `gate` |
| `data/tracks.json` | counts per ENTRY/FLOW/BOOST state and gate decision |
| `data/capabilities.json` | capability / risk aggregation |
| `spec/tracks.json` | HCB's consumer mapping of `dsh-levels/1` |
| `schema/hcb.schema.json` | JSON schema for v0.2 |
| `scripts/collect.mjs` | reproducible collector |
| `scripts/validate.mjs` | validates the matrix |
| `.github/actions/check` | drop-in CI check |
| `index.html` | static viewer (GitHub Pages) |

**Evidence levels**: `declared` (from package metadata), `tested` (a human ran it), `unknown`. v0.2 only covers `declared`. Tested rows are v0.3 and must include a repro script.

## Current coverage (2026-11-14)

- **44 plugins** (20 first-party/seed + 24 from npm search / external additions)
- **24** declare `engines.dsh`; **20** are `unknown`
- **1** declares `dsh.standards`; **43** are `not-declared`
- ENTRY: 1 `not-run`, 43 `unknown` — **no plugin has runtime evidence yet**
- Risk: 2 high, 4 medium, 38 unknown (no capability manifest)
- Gate: 22 `review`, 22 `pilot`, 0 `production-candidate`

> The near-zero `dsh.standards` adoption is itself a finding. The gate is a **compatibility/risk heuristic**, not a quality grade.

## Quick start

```bash
npm install
npm run collect   # needs GITHUB_TOKEN for higher rate limits
npm run validate
python3 -m http.server 8080   # open index.html
```

## Use in CI

```yaml
- uses: PerryLink/dsh-compat-baseline/.github/actions/check@main
  with:
    package: your-npm-package
```

It prints compatibility + tracks + gate; fails only on `declared-incompatible` by default. See [docs/CI.md](docs/CI.md).

## How to add a plugin

1. Add the npm package name to `data/plugins.seed.json`.
2. Run `npm run collect`.
3. Open a PR with the regenerated `data/*.json` and the reason.

## What this is not

- Not a security audit. Declared capabilities ≠ actual behavior.
- Not a ranking. No total score; ENTRY/FLOW/BOOST are separate.
- Not a certification. `production-candidate` only means HCB found no blocker in the checks it knows.
- Not official. Do not use the DeepSeek name/logo to imply endorsement.

## Roadmap

- **v0.2** declared compatibility + three tracks + risk/gate (this).
- **v0.3** tested matrix for top 20 plugins × 5 hosts, with Docker repro.
- **v0.4** capability diff between versions and stale alerts.
- **v1.0** stable schema + CI action + weekly refresh + DOI.

## License

MIT (code and data). See `LICENSE`. The track model is Apache-2.0 from dsh-standards; see `NOTICE.md`.
