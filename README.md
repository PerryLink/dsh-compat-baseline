# HCB — Host Compatibility Baseline for DeepSeek Harness plugins

> **Declared** compatibility, not tested compatibility. v0.1.
> Independent community project. **Not affiliated with DeepSeek.**

DSH ships fast and breaks compatibility often. Plugin authors and enterprise buyers have no single place to answer:

- Which DSH versions does this plugin *declare* support for?
- Which permission/capability surface does it request?
- Which plugins are already stale relative to the latest host?

HCB is a small, reproducible dataset + schema + collector that answers these questions from package metadata (`engines.dsh`, `peerDependencies`, `dsh.capabilities`, `dsh.manifestVersion`) and DSH GitHub releases.

## What is in v0.1

| File | Meaning |
|---|---|
| `data/hosts.json` | DSH releases (tag → version → date) |
| `data/matrix.json` | plugin × host matrix with `declared-compatible`, `declared-incompatible`, `unknown` |
| `data/capabilities.json` | capability/ permission surface counts |
| `schema/hcb.schema.json` | JSON schema for the matrix |
| `scripts/collect.mjs` | reproducible collector (npm + GitHub) |
| `scripts/validate.mjs` | validates the matrix |
| `index.html` | static viewer (GitHub Pages) |

**Evidence levels**: `declared` (from package metadata), `tested` (a human ran it), `unknown`. v0.1 only covers `declared`. Tested rows are v0.2 and must include a repro script.

## Quick start

```bash
npm install
npm run collect   # needs GITHUB_TOKEN for higher rate limits
npm run validate
python3 -m http.server 8080   # open index.html
```

## How to add a plugin

1. Add the npm package name to `data/plugins.seed.json`.
2. Run `npm run collect`.
3. Open a PR with the regenerated `data/*.json` and the reason.

## What this is not

- Not a security audit. Declared capabilities ≠ actual behavior.
- Not a ranking. `declared-compatible` is a claim by the package author, not a test result.
- Not official. Do not use the DeepSeek name/logo to imply endorsement.

## Roadmap

- **v0.1** declared matrix (this).
- **v0.2** tested matrix for top 20 plugins × 5 hosts, with Docker repro.
- **v0.3** capability diff (what changed between versions) and stale alerts.
- **v1.0** stable schema + CI action + weekly refresh.

## License

MIT (code and data). See `LICENSE`.
