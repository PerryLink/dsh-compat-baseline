# Changelog

## 0.13.0 — 2026-11-15

- Add **5 more `tested` rows** from a second G0–G3 batch:
  `dsh-checkpoint-rewind@0.6.35`, `dsh-claude-move@0.4.20`,
  `dsh-data-quality@0.3.27`, `dsh-doublecheck@0.9.32`,
  `dsh-session-sync@0.3.2`. All passed `DSH-ENTRY runtime` (1/1 ACTIVE).
- Summary: 0 declared / 131 checked / 12 tested; ENTRY 12 runtime + 129
  recognized + 2 failed; gate unchanged 2 blocked / 31 review / 109 pilot /
  1 production-candidate.

## 0.12.0 — 2026-11-15

- Add **6 more `tested` rows** from a G0–G3 batch: `dsh-budget@0.4.26`,
  `dsh-defend@0.3.28`, `dsh-mask@0.2.25`, `dsh-memento@0.5.31`,
  `dsh-observe@0.2.28`, `dsh-test-drive@0.3.26`. Each booted a real host
  (`0.2.2-rc.3`, 1/1 ACTIVE) and passed `DSH-ENTRY runtime`.
- `dsh-auto-review@0.15.2` and `dsh-permission-rules@0.8.1` also passed
  G0–G3, but their checker conclusion was `warn` (DSC-11 / DSC-12), so they
  were **not** written as tested; no false pass.
- Refresh `dsh-click` to `0.3.30` (published) with its real capabilities;
  `dsh-mcp-panel` remains on 0.6.31 pending npm 2FA.
- Summary: 0 declared / 136 checked / 7 tested; ENTRY 7 runtime + 134
  recognized + 2 failed; gate 2 blocked / 31 review / 109 pilot / 1
  production-candidate.

## 0.11.1 — 2026-11-15

- **Absorb 12 published releases and re-check every one.** Each row was
  refreshed from the official registry (`https://registry.npmjs.org`) and
  re-audited with the published tarball, checker `dsh-standards@1.7.0`,
  host anchor `0.2.2-rc.3` and `--scope entry --entry-claim static`:
  `dsh-research-report` 0.4.1 -> 0.4.2, `dsh-local-ai` 0.2.26 -> 0.2.27,
  `dsh-industry-research` 0.3.25 -> 0.3.26, `dsh-checkpoint-rewind`
  0.6.34 -> 0.6.35, `dsh-defend` 0.3.27 -> 0.3.28, `dsh-claude-move`
  0.4.19 -> 0.4.20, `dsh-budget` 0.4.25 -> 0.4.26, `dsh-data-quality`
  0.3.26 -> 0.3.27, `dsh-mask` 0.2.24 -> 0.2.25, `dsh-fund-research`
  0.5.3 -> 0.5.4, `dsh-observe` 0.2.27 -> 0.2.28, `dsh-test-drive`
  0.3.25 -> 0.3.26. All 12: checker **`pass`**, ENTRY **`recognized`**,
  **13/14** static checks, **0 blocking** findings.
- **The capability surface was empty and is no longer.** The 12 rows carried
  `capabilities: []`; their new versions declare **52** capability entries.
  Totals move `tools:register` 62 -> 72, `network:egress` 5 -> 12,
  `fs:read` 3 -> 11, `fs:write` 1 -> 9, `sessions:write` 4 -> 11,
  `subprocess` 2 -> 6, `sessions:read` 3 -> 5, `system-prompt:write`
  1 -> 5, and introduce `network:ingress` 0 -> 1 and `llm:adapter` 0 -> 1.
- **All 12 now declare `dsh.standards`** (`dsh-levels/1`; ENTRY/FLOW
  `not-run`, BOOST `not-measured`). `standardsDeclared` **9 -> 21**; FLOW
  `not-run` **6 -> 18** (`unknown` 134 -> 122); BOOST `not-measured`
  **9 -> 21** (`unknown` 134 -> 122). The checker still overrides the declared
  ENTRY `not-run` with `recognized` and preserves `declaredStatus: "not-run"`;
  FLOW and BOOST stay the authors' declarations, not HCB claims.
- **Gate moves nine rows from `pilot` to `review`.** Risk moves from
  **3 high / 63 medium / 77 unknown** to **12 high / 66 medium / 65 unknown**:
  the nine packages declaring `fs:write` and/or `subprocess`
  (`dsh-research-report`, `dsh-local-ai`, `dsh-industry-research`,
  `dsh-checkpoint-rewind`, `dsh-claude-move`, `dsh-data-quality`, `dsh-mask`,
  `dsh-fund-research`, `dsh-test-drive`) are high-capability and gate to
  `review`. Headline gate: **2 blocked / 30 review / 110 pilot / 1
  production-candidate** (was 2 / 21 / 119 / 1). The 3 remaining refreshed
  rows (`dsh-defend`, `dsh-budget`, `dsh-observe`) are medium risk and stay
  `pilot`.
- **ENTRY and evidence shape unchanged.** All **143/143** rows still carry
  independent evidence: **0 declared / 142 checked / 1 tested**; ENTRY is
  **1 runtime + 140 recognized + 2 failed**. The `tested` row
  `dsh-plugin-guide@0.5.9` and the two `failed` rows (`dsh-checkers@0.0.1`,
  `dsh-session-fork@0.4.0`) are byte-identical to v0.11.0 and were **not**
  re-run. All 143 rows still record `dsh-standards@1.7.0`.
- **Not refreshed (kept at the old version):** `dsh-mcp-panel@0.6.31`
  (`0.6.32` still 404 on the registry) and `dsh-click@0.3.29`. At
  `declare-14` time click `0.3.30` was staged, not published; during this
  round the registry began serving `0.3.30` (published `2026-11-15T11:47:02Z`),
  but the row was deliberately left unchanged per the 12-package scope. It
  should be absorbed in the next refresh.
- Twelve new evidence directories under
  `evidence/<pkg>/<version>/0.2.2-rc.3/<stamp>/`, each with `report.json`,
  `patch.json`, `pack.json`, `checker.stdout.json` and `audit.json`; every
  report SHA-256 matches both its `patch.json` and `audit.json`.
- Version **0.11.1**. Local only: no push, no publish.

## 0.11.0 — 2026-11-15

- **First `tested` row**: `dsh-plugin-guide@0.5.9` / host `0.2.2-rc.3`
  booted a real DSH host and passed ENTRY G0–G3 (`dsh-standards@1.7.0
  --entry-claim runtime`, 1/1 ACTIVE). Evidence source is `tested`; ENTRY
  moves from `recognized` to `runtime`.
- Gate moves from `pilot` to **`production-candidate`** for that row
  (ENTRY runtime + FLOW manual + risk medium); all other rows unchanged.
- Summary: 0 declared / 142 checked / 1 tested; ENTRY 1 runtime + 140
  recognized + 2 failed; gate 2 blocked / 21 review / 119 pilot / 1
  production-candidate.
- The test-kit keyless smoke is `partial` (missing model credential); HCB
  `tested` is based on the G0–G3 boot, not on a model task.

## 0.10.3 — 2026-11-15

- **Absorb four new releases and re-check them.** `dsh-lsp-actions`
  0.5.20 -> 0.5.21, `dsh-doublecheck` 0.9.31 -> 0.9.32, `dsh-memento`
  0.5.30 -> 0.5.31, `dsh-session-sync` 0.3.0 -> 0.3.2 (npm `latest`; 0.3.1
  was never published). Each row was refreshed from the official registry
  (`https://registry.npmjs.org`), its old `checked` evidence was reset to
  `declared`, and it was re-audited with
  `HCB_CHECKER_VERSION=1.7.0 node scripts/audit-entry.mjs <pkg> --version <v> --merge`.
  All four completed: checker `pass`, ENTRY `recognized`, **13/14** static
  checks, **0 blocking** findings. Warnings: `DSC-03` for `dsh-lsp-actions`
  and `dsh-doublecheck`; none for `dsh-memento` and `dsh-session-sync`.
- **Capability surface changed in three of the four.** `dsh-doublecheck`
  adds `sessions:write`; `dsh-memento` adds `sessions:write` and
  `system-prompt:write` (new to the matrix); `dsh-session-sync` adds
  `sessions:read` and `sessions:write`. `dsh-lsp-actions` is unchanged.
  Risk levels stay `high` / `medium` / `medium` / `high`; gate decisions stay
  `review` / `pilot` / `pilot` / `review`, so the headline gate split is
  unchanged.
- **All four now declare `dsh.standards`** (`dsh-levels/1`, declared ENTRY
  and FLOW `not-run`, BOOST `not-measured`). This moves
  `summary.standardsDeclared` **5 -> 9**, FLOW `not-run` **2 -> 6**
  (`unknown` 138 -> 134) and BOOST `not-measured` **5 -> 9**
  (`unknown` 138 -> 134). The checker overrides the declared ENTRY
  `not-run` with `recognized` and keeps `declaredStatus: "not-run"`; FLOW and
  BOOST remain the authors' declarations, not HCB claims.
- **Both failed rows were re-checked and stay failed.**
  `dsh-checkers@0.0.1` and `dsh-session-fork@0.4.0` are still npm `latest`,
  so no re-run was needed; the stored reports still conclude `fail`
  (`DSC-01` C-1.2 for both, plus `DSC-04` for `dsh-session-fork`). Both keep
  `evidence.source: "checked"` and gate `blocked`.
- **Totals unchanged:** 143 rows; evidence **0 declared / 143 checked /
  0 tested**; ENTRY **141 `recognized` + 2 `failed`**; gate **2 `blocked` /
  21 `review` / 120 `pilot` / 0 `production-candidate`**; risk **3 high /
  63 medium / 77 unknown**; compat **123 compatible / 0 incompatible /
  20 unknown**.
- Four new evidence directories under
  `evidence/<pkg>/<version>/0.2.2-rc.3/<stamp>/` (`report.json`,
  `patch.json`, `pack.json`, `checker.stdout.json`, `audit.json`); each
  report's SHA-256 matches both `audit.json` and `patch.json`.
- `data/tracks.json` and `data/capabilities.json` recomputed from the final
  matrix. `sessions:write` **1 -> 4**, `sessions:read` **2 -> 3**,
  `system-prompt:write` **0 -> 1**; tracks now also carries the v0.10.1
  FLOW `manual` row (manual **2 -> 3**). `data/coverage.json` was not
  rewritten (historical snapshot); `npm run coverage` prints the
  matrix-derived result (mainline-default declared tracks **3 -> 9**).
- Version **0.10.3**. Local only: no push, no publish.

## 0.10.2 — 2026-11-15

- **Checker unified to `dsh-standards@1.7.0` (16-ID capability set).** Re-ran
  the 95 rows whose evidence still said `1.6.10`, pinned to each `row.version`
  and the `0.2.2-rc.3` host anchor, with
  `npm_config_registry=https://registry.npmjs.org HCB_CHECKER_VERSION=1.7.0`
  and `--merge`. All 95 completed; **143/143 rows now record
  `dsh-standards@1.7.0`** (`1.6.10` survives only as a historical label in
  `row.evidence.checker`).
- **No ENTRY or gate movement:** 141 `recognized` + 2 `failed` before and
  after; gate stays 2 `blocked` / 21 `review` / 120 `pilot` /
  0 `production-candidate`. Checker conclusions for the 95: **85 `pass`,
  9 `warn`, 1 `fail`**. The only blocking re-audit is the pre-existing
  `dsh-checkers@0.0.1` (`DSC-01`); `dsh-session-fork@0.4.0` keeps its earlier
  `failed` and its gate stays `blocked`.
- Make 1.7.0 the **default** in `scripts/audit-entry.mjs` and
  `scripts/lib/evidence.mjs` (was 1.6.10); `HCB_CHECKER_VERSION` still
  overrides it for historical reproduction. `jevcore@0.4.2` and
  `dsh-standards@1.6.12` record 7/14 static checks, a coverage caveat rather
  than a pass claim.
- README/docs now state that the default checker is 1.7.0 and that historical
  rows are labeled by `row.evidence.checker`.
- Backfilled **292** missing `report.json`/`patch.json` files to
  `PerryLink/dsh-hcb` with an add-only `git push` (102 files from the
  0.10.0/0.10.1 gap, 190 from this re-audit). `pack.json`, `audit.json`,
  `checker.stdout.json` and one `hcb-decision.md` were not uploaded in this
  pass.

## 0.10.1 — 2026-11-15

- Add FLOW `manual` evidence for `dsh-plugin-guide@0.5.9` (J5 negation-filtered
  disclosure, J7 live-inventory substitute, J8 headless + web HTTP 200; J3
  not-run because the plugin exposes no config schema). `manual` is not
  `runtime`.
- FLOW summary: **3 manual / 2 not-run / 138 unknown**; gate unchanged
  (2 blocked / 21 review / 120 pilot / 0 production-candidate).

## 0.10.0 — 2026-11-15

- **The last 24 external `declared` rows are now `checked`: the matrix is
  143/143 `checked`, 0 `declared`.** All 24 audits used
  `HCB_CHECKER_VERSION=1.7.0` and `npm_config_registry=https://registry.npmjs.org`
  (npmmirror lags), host anchor `0.2.2-rc.3`, Node 24.22.1,
  `--scope entry --entry-claim static`. Total `checked` **119 -> 143**,
  `declared` **24 -> 0**, `tested` stays **0**. Exactly **24** new
  `evidence/<pkg>/<version>/0.2.2-rc.3/<stamp>/` directories were written, one
  per audited row, each with raw report + patch + pack + audit metadata; every
  report SHA-256 matches both `audit.json` and `patch.json`.
- Results: **23 `recognized` + 1 `failed`**, 0 ENTRY `blocked`, 0 audit errors.
  Checker conclusions: 9 `pass`, 14 `warn`, 1 `fail`. Every package exists on
  npm at the audited version and every `npm pack` succeeded. The failure is a
  real finding, not an environment error: **`dsh-session-fork@0.4.0`** publishes
  an `exports["."]` / `main` pointing at `./lib/index.js`, which is **missing
  from the tarball** (DSC-01 C-1.2, plus DSC-04 C-4); its ENTRY is `failed`
  and its gate is `blocked`.
- **Two rows record partial coverage honestly**: `dsh-plugin-shop-catalog@2026.1113.0`
  and `dsh-plugin-ops-core@0.20.9` ran only **7/14** checks — six runtime
  checks (`DSC-04..09`) need `--runtime`, and `C-3.5` was not checked, so the
  report's `entryBlocking.pass` is `false`. The checker still returned `warn`
  and HCB maps `warn -> recognized` (no blocking bucket); the raw report keeps
  `notChecked` / `entryBlocking`, and no `static`/`runtime` claim was invented.
- Warnings recorded, not hidden: **all 24** carry DSC-11 (`dsh.capabilities`
  absent) and DSC-13 (`dsh.labels` absent); 13 carry DSC-02 (version
  declaration WARN), 2 carry DSC-03 (install spec / supply chain), 3 carry
  DSC-12. `DSC-14` and `DSC-04..09` remain outside the static ENTRY scope, so
  `13/14` is the expected static ceiling (not a perfect score).
- **Version drift, recorded instead of papered over**: npm `latest` had moved
  past three matrix rows — `dsh-plugin-compat-check` (row 0.2.4, npm 0.2.5),
  `dsh-plugin-ops-core` (0.20.9, npm 0.21.1), `dsh-plugin-ops-bundle`
  (0.20.9, npm 0.21.1). This round audits the **recorded matrix version**, so
  the evidence matches the row: bumping them is a metadata-refresh round, and
  `dsh-plugin-compat-check@0.2.5` newly declares `dsh.standards`, which would
  move the external `declaredTracks` column (0 -> 1) — a data change, not an
  evidence change, deliberately out of scope here.
- ENTRY summary: `{recognized:141, failed:2, blocked:0, not-run:0,
  unknown:0}` (was 118/1/0/0/24). Gate: **2 blocked / 21 review / 120 pilot /
  0 production-candidate** (was 1/22/120/0); the only movement is
  `dsh-session-fork` review -> blocked, a direct consequence of its real
  `failed` ENTRY. Risk and compat are unchanged (3 high / 63 medium / 77
  unknown; 123 compatible / 20 unknown).
- 143 rows and their order are unchanged. Coverage structure is unchanged
  (143/143 covered, 0 missing; each group's `total` / `covered` /
  `declaredTracks` / `compatDeclared` identical; `engines.dsh` 123/20;
  `dsh.standards` 5/138). The external gate split moves with the failure
  (`review 19 -> 18`, `blocked 1 -> 2`). `data/coverage.json` was **not
  rewritten** (byte-identical; it already predates the v0.8.1+ gate changes).
  `data/tracks.json` and `data/capabilities.json` were recomputed from the
  final summary.
- `data/matrix.v0.10.0.pre-merge.json` is the pre-merge backup (sha256
  `8c657d06...bd00e6`, 143 rows, evidence `{declared:24, checked:119,
  tested:0}`). Version files bumped `0.9.0 -> 0.10.0` (`package.json`,
  `package-lock.json`, `CITATION.cff`).
- `npm run validate`, `node scripts/coverage.mjs` and `npm test` (10/10) pass.
  Local only: **no push, no publish**.

## 0.9.0 — 2026-11-14

- **The dsh-kit family is fully `checked`: 112/112** (34 mainline-default +
  53 mainline-opt-in + 10 catalog-only + 15 domain). The remaining 8
  catalog-only and all 15 domain rows move `declared -> checked`
  (**23 new**); total `checked` **96 -> 119**, `declared` **47 -> 24** (all
  external), `tested` stays **0**.
- All 23 audits used `HCB_CHECKER_VERSION=1.7.0` (16-ID capability set,
  `sessions:write`) and `npm_config_registry=https://registry.npmjs.org`
  (npmmirror lags), host anchor `0.2.2-rc.3`, Node 24.22.1,
  `--scope entry --entry-claim static`. Every package exists on npm at the
  matrix version; **0 failed, 0 blocked, 0 audit errors**. All 23 checker
  conclusions were `pass` -> ENTRY `recognized` (13/14 checks, 0 blocking).
- Warnings recorded, not hidden: 7 of the 8 catalog-only rows carry DSC-03
  (`install spec or supply-chain issue`); `dsh-community-bench` instead
  carries DSC-11 (`dsh.capabilities` not declared) and DSC-13 (`dsh.labels`
  not declared). The 15 domain rows carry no warnings. `DSC-14` and
  `DSC-04..09` remain outside the static ENTRY scope on every row (unchanged
  limitation), so `13/14` is the expected static coverage. Raw reports +
  patches are under `evidence/<pkg>/<version>/0.2.2-rc.3/`; each report
  SHA-256 matches both `audit.json` and `patch.json`.
- ENTRY summary: `{recognized:118, failed:1, blocked:0, unknown:24, ...}`
  (was 95/1/0/47). Gate is unchanged at **1 blocked / 22 review / 120 pilot /
  0 production-candidate**; risk is unchanged at 3 high / 63 medium /
  77 unknown. The 23 rows were ENTRY `unknown` and `pilot` before and after
  the merge — no `runtime` claim was created, so no gate decision moved.
- 143 rows and their order are unchanged. Coverage totals are unchanged
  (112/112 family + 31 external, 0 missing; `engines.dsh` 123/20;
  `dsh.standards` 5/138). `data/coverage.json` was **not rewritten**
  (byte-identical; sha256 `fc60fa1f...6540d`); it already predates the
  v0.8.1/v0.8.2 gate changes. `data/tracks.json` and `data/capabilities.json`
  were recomputed from the final summary, fixing the 0.8.2 round's stale
  `tracks.json` (which still showed the 0.8.1 `blocked:2`/`recognized:94`).
- `data/matrix.v0.9.0.pre-merge.json` is the pre-merge backup (sha256
  `b83849cf...a85da7`). Version files bumped `0.8.2 -> 0.9.0`; `package-lock.json`
  and `CITATION.cff` had lagged at 0.8.1 and are now aligned.
- `npm run validate`, `node scripts/coverage.mjs` and `npm test` (10/10) pass.
  Local only: **no push, no publish**.

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
