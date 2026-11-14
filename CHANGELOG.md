# Changelog

## 0.5.0 — 2026-11-14

- Add the **evidence layer**: every matrix row now carries
  `evidence: {source, checkedAt, host, checker, reportPath}` with
  `source` = `declared` | `checked` | `tested`.
- Add `scripts/audit-entry.mjs`: `npm pack` the published artifact, run
  `dsh-standards@1.6.10 --scope entry --entry-claim static --format json`,
  write the raw report + an `hcb-evidence-patch/1`, and optionally `--merge`
  into `data/matrix.json` (backup first, version/report hash checked).
- Map checker `pass`/`warn` -> `recognized`, `fail` -> `failed`,
  `incomplete` -> `blocked`; a static claim can never become `runtime`.
  Preserve the author's claim in `standards.entry.declaredStatus`.
- `scripts/collect.mjs` preserves checked/tested evidence only for the exact
  same package version; a version bump resets the row to `declared`.
- Add `scripts/lib/evidence.mjs`, `scripts/lib/gate.mjs`,
  `scripts/migrate-v05.mjs`, `scripts/audit-entry.test.mjs`,
  `docs/EVIDENCE.md`; update the JSON Schema and validator for v0.5.
- Migrate all 143 existing rows to `declared` evidence (no coverage change).
  v0.4 matrix backed up as `data/matrix.v0.4.backup.json`.
- Merge **10 `checked` rows** from `audit-entry.mjs` (0 blocking: 7 pass, 3 warn);
  the rest stay `declared`. `tested` remains 0.
- `dsh-plugin-guide@0.5.8` and `dsh-permission-rules@0.8.0` map to `recognized`
  with `source: checked`; their reports are stored under `evidence/` and merged.

## 0.2.0 — 2026-11-14

- Integrate the DSH-ENTRY / DSH-FLOW / DSH-BOOST model as **three independent tracks** (no total score).
- Ingest `dsh.standards` (`dsh-levels/1`) from npm metadata; missing → `not-declared` / `unknown`.
- Add capability **risk** buckets (low/medium/high/unknown) and `hcb-gate/1` review heuristic.
- Add `spec/tracks.json`, `NOTICE.md`, `docs/TRACKS.md`.
- Viewer: plugin × compat × ENTRY × FLOW × BOOST × risk × gate.
- CI check prints tracks + risk + gate.
- Collector/validator emit and validate v0.2 fields; weekly workflow fixed (`git push origin HEAD:main`).
- 44 plugins; 24 declare `engines.dsh`; 1 declares `dsh.standards`; 22 pilot / 22 review.

## 0.1.0 — 2026-11-14

- Initial declared compatibility matrix: 34 plugins × 10 hosts.
- Capability aggregation, collector, validator, GitHub Pages viewer.
