# Changelog

## 0.8.2 — 2026-11-14

- Re-audit `dsh-permission-rules@0.8.1` with `dsh-standards@1.7.0` (16-ID
  capability set, `sessions:write`): 13/14 checks, 0 blocking, ENTRY
  `recognized`; the previous 1.6.10 `blocked` note is superseded.
- Gate returns to **1 blocked / 22 review / 120 pilot / 0 production-candidate**.
- `scripts/audit-entry.mjs` accepts `HCB_CHECKER_VERSION` (default stays 1.6.10)
  so a single row can be re-audited with a newer checker without rewriting all
  historical evidence.

## 0.8.1 — 2026-11-14

- **Refresh three changed package rows to the latest npm release without a full
  collect**: `dsh-auto-review` 0.15.1 -> **0.15.2**,
  `dsh-permission-rules` 0.8.0 -> **0.8.1**, `dsh-plugin-guide` 0.5.8 ->
  **0.5.9**. Version, capabilities, `dsh.standards`, range, repository and
  download metadata were read directly from `registry.npmjs.org`; the 140
  other rows were not touched. `data/matrix.v0.8.1.pre-refresh.json` is the
  pre-refresh backup (sha256 `b5edca20...54348aee`).
- **New declarations absorbed**: `dsh-auto-review` and
  `dsh-permission-rules` now declare `dsh.standards` (`dsh-levels/1`,
  entry/flow/boost = `not-run`/`not-run`/`not-measured`), so
  `standardsDeclared` is **3 -> 5**. `dsh-permission-rules` now declares
  `[fs:read, fs:write, network:egress, sessions:write]` (risk
  `unknown -> high`, gate `pilot -> review`); `dsh-plugin-guide` now declares
  `[fs:read]` (risk `unknown -> medium`, gate stays `pilot`);
  `dsh-auto-review` keeps `[network:egress, sessions:read]` (medium, `pilot`).
- **`checked` stays 96**: all three new versions were re-audited with
  `dsh-standards@1.6.10` at host `0.2.2-rc.3`. Results: auto-review `pass`,
  permission-rules `warn`, guide `pass`. Auto-review and guide map to
  `recognized`; permission-rules keeps its `checked` report but is held ENTRY
  `blocked` (see next bullet). `declared` stays 47 and `tested` stays 0.
  Old-version reports remain under `evidence/<name>/<old-version>/`; the new
  reports are under `evidence/<name>/<new-version>/0.2.2-rc.3/`.
- **Checker vocabulary gap recorded, not faked**: `sessions:write` is not in
  checker 1.6.10's 15-ID capability closed set, so DSC-11/C-11.1 emits
  `unknown capability id: sessions:write`; the ENTRY scope downgrades DSC-11
  to WARN and the raw checker conclusion is `warn`/`recognized`. HCB does not
  launder that into a clean pass: the `checked` report is retained, but
  `standards.entry.status` is held **`blocked`** with `declaredStatus:
  "not-run"` until a 16-ID checker re-audit. The row note records the gap; this
  is an evidence gap, not a package defect.
- **DSH-FLOW `manual` for two rows, not runtime**: `dsh-auto-review` and
  `dsh-permission-rules` carry `flow.status = "manual"`, `flow.evidence = true`
  and a note citing the flow-harness J3/J5/J7/J8 results on `0.2.2-rc.3`.
  `dsh-plugin-guide` stays `not-run`. No `runtime` claim was written; J7 start
  line and J8 browser/console remain unproven.
- Fresh summary: ENTRY `{recognized:94, blocked:1, failed:1, not-run:0,
  unknown:47}`; FLOW `{manual:2, not-run:3, unknown:138}`; BOOST
  `{not-measured:5, unknown:138}`; risk `{medium:63, high:3, unknown:77}`
  (was 62/2/79); gate `{blocked:2, review:21, pilot:120,
  production-candidate:0}` (was 1 blocked / 21 review / 121 pilot). 143 rows
  and their order are unchanged.
- Coverage totals/covered/missing/compat are unchanged (143 rows, 112/112
  family + 31 external, 0 missing). The mainline-default "declared tracks"
  count moves 3 -> 5 and its gate split moves from 32 pilot / 2 review to
  31 pilot / 2 review / 1 blocked, direct consequences of the new declarations
  and the `sessions:write` hold; `data/coverage.json` was not rewritten.
- Version files bumped `0.8.0 -> 0.8.1`; `npm run validate`, `npm run coverage`
  and `npm test` pass (10/10). Local only: no push, no publish.

## 0.8.0 — 2026-11-14

- **Finish `mainline-opt-in` and start `catalog-only`: 36 more rows are now
  `checked`.** Total `checked` is **60 -> 96** (34 mainline-default + 53
  mainline-opt-in + 2 catalog-only + 7 external); `declared` 83 -> 47;
  `tested` remains **0**.
- New results: **36 `pass` -> all 36 map to `recognized`**; 0 blocking, 0 failed,
  0 blocked. All 36 carry the DSC-03 hygiene warning; 19 of them also carry
  DSC-11 and DSC-13. Every new report is stored under `evidence/` with its
  SHA-256 checked against `audit.json` and `patch.json`.
- ENTRY summary: `{recognized:95, failed:1, not-run:0, unknown:47}`; gate
  `{blocked:1, review:21, pilot:121, production-candidate:0}`. The 36 new rows
  were all `pilot` before and after; only their gate reasons changed from
  "no dsh.standards declaration" to "ENTRY recognized, FLOW unknown".
- 143 rows and their order are unchanged; only the 36 rows changed
  `standards.entry` / `evidence` / `gate`. Coverage totals/missing/tracks/compat
  and every group's gate distribution are unchanged from the pre-merge matrix.
- Only static ENTRY (`--entry-claim static`) was run; no `tested`, no runtime
  claim. Checker pinned to `dsh-standards@1.6.10`, host `0.2.2-rc.3`.
  Pre-merge matrix: `data/matrix.v0.8.0.pre-merge.json`. Local only: no push,
  no publish.

## 0.7.0 — 2026-11-14

- **Start `mainline-opt-in`: the first 19 of 53 rows are now `checked`.**
  Total `checked` is **41 -> 60** (34 mainline-default + 19 opt-in + 7 external);
  `declared` 102 -> 83; `tested` remains **0**.
- New results: **18 `pass` + 1 `warn` -> all 19 map to `recognized`**; 0 blocking,
  0 failed, 0 blocked. The warn is `dsh-essay-rubric-check@0.2.11` (DSC-11
  safety/brand fields, plus the DSC-03 warning shared by all 19 rows).
  Every new report is stored under `evidence/` with its SHA-256 checked against
  `audit.json` and `patch.json`.
- ENTRY summary: `{recognized:59, failed:1, not-run:0, unknown:83}`;
  gate `{blocked:1, review:21, pilot:121, production-candidate:0}`. The 19 new
  rows were all `pilot` before and after; only their gate reasons changed from
  "no dsh.standards declaration" to "ENTRY recognized, FLOW unknown".
- 143 rows and their order are unchanged; only the 19 rows changed
  `standards.entry` / `evidence` / `gate`. Coverage totals/missing/tracks/compat
  and every group's gate distribution are unchanged.
- Only static ENTRY (`--entry-claim static`) was run; no `tested`, no runtime
  claim. Checker pinned to `dsh-standards@1.6.10`, host `0.2.2-rc.3`.
  Pre-merge matrix: `data/matrix.v0.7.0.pre-merge.json`. Local only: no push,
  no publish.

## 0.6.0 — 2026-11-14

- **Finish `mainline-default`: 34 / 34 rows now `checked`.** 21 rows were still
  `declared` (not 14: the previous 20 checked included 7 `external` rows), so
  this release audits and merges all 21. Total `checked` is **41** (34
  mainline-default + 7 external); `declared` 123 -> 102; `tested` remains **0**.
- New results: **20 `pass` + 1 `warn` -> all 21 map to `recognized`**; 0 blocking.
  The warn is `dsh-output-styles@0.8.3` (DSC-11 capability/labels declaration).
  Every new report is stored under `evidence/` with its SHA-256 checked against
  `audit.json`.
- **`dsh-checkers@0.0.1` stays `failed`, not `blocked`.** It is not a meta/tooling
  package: it is a reserved-name placeholder for a checkers game plugin whose
  tarball is only `README.md` + `package.json`. The checker completed and found
  a blocking defect (DSC-01 / C-1.2: no resolvable runtime entry), so `failed`
  is the correct package verdict; `blocked` would mean the checker could not
  establish a verdict. `standards.entry.note` records this; the gate remains
  `blocked` and no pass was manufactured.
- ENTRY summary: `{recognized:40, failed:1, not-run:0, unknown:102}`;
  gate `{blocked:1, review:21, pilot:121, production-candidate:0}` (the 21 new
  rows were all `pilot` before and after). 143 rows and their order are unchanged;
  coverage totals/missing/tracks/compat and every group's gate distribution are
  unchanged.
- Only `standards.entry` / `evidence` (and gate recomputation) changed; no
  `tested`, no runtime claim. Checker pinned to `dsh-standards@1.6.10`, host
  `0.2.2-rc.3`. Pre-merge matrix: `data/matrix.v0.6.0.pre-merge.json`.
  Local only: no push, no publish.

## 0.5.1 — 2026-11-14

- Expand ENTRY **`checked` from 10 to 20 rows** (seed positions 11–20):
  9 new rows map to `recognized` (6 `pass`, 3 `warn`) and
  `dsh-checkers@0.0.1` maps to `failed` (`DSC-01` / C-1.2: no resolvable
  runtime entry; 1 blocking, 6/14 checks). Failures are recorded as evidence,
  not hidden. `tested` remains **0** — no host boot was performed.
- Evidence summary is now `{declared:123, checked:20, tested:0}`; ENTRY is
  `{recognized:19, failed:1, not-run:2, unknown:121}`; gate is
  `{blocked:1, review:21, pilot:121, production-candidate:0}` (the failed
  checked row gates as `blocked`).
- All 143 rows and their order are unchanged; only 10 rows changed
  `standards.entry` / `evidence` / `gate`. Raw reports live under `evidence/`;
  the pre-merge matrix is backed up as `data/matrix.v0.5.1.pre-merge.json`.
- Checker is pinned to `dsh-standards@1.6.10` with host `0.2.2-rc.3`; no push,
  no publish.

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
