# Evidence in HCB v0.5

> **Scope: DSH-ENTRY only.** One row is one package version. Evidence is not a
> score, not a certification, and not a substitute for a runtime test.

HCB v0.4 could only say what a package **declared**. A `dsh.standards` entry of
`not-run` meant "the author did not claim a run"; it did not tell a reader
whether anybody had looked at the package. HCB v0.5 adds an explicit evidence
layer so that three very different things can never be confused:

| Level | What happened | What it proves |
|---|---|---|
| `declared` | HCB read npm metadata / `package.json#dsh.standards` | What the author claims, nothing more |
| `checked` | a named checker ran against the **published tarball** | Static ENTRY structure was examined; **no boot** |
| `tested` | a real DSH host booted the plugin (ENTRY G0–G3) | Runtime ENTRY behaviour was observed |

`checked` is **not** `tested`. `declared` is **not** `checked`. A static pass is
not a runtime pass.

## 1. The three levels

### `declared`

The row comes from package metadata: `engines.dsh`, `peerDependencies`,
`dsh.capabilities`, `dsh.standards`. No independent checker ran.

- `checkedAt`, `host`, `checker`, `reportPath` are all `null`.
- `standards.entry.status` may be `not-run`, `unknown`, or an author claim such
  as `runtime`. It is still only a declaration.
- `not-declared` / `unknown` rows are also `declared`: the provenance level is
  "package metadata", not "a claim exists".

### `checked`

A checker ran against the bytes that npm actually publishes:

1. `npm pack <name>@<version>` into a throwaway directory;
2. verify and extract the tarball (no install, no lifecycle scripts);
3. run `npx -y dsh-standards@1.6.10 <dir> --scope entry --entry-claim static --format json`;
4. store the raw report and a patch with its SHA-256.

A `checked` result proves that the static ENTRY shape was examined at a named
host anchor. It does **not** prove that the plugin installs, boots, or works.
That is why the checker is invoked with `--entry-claim static`: the resulting
`DSH-ENTRY recognized` level is a static-recognition claim, never `runtime`.

### `tested`

A real DSH host executed the plugin (ENTRY G0–G3). `tested` requires a runtime
report with the host, artifact, and result. FLOW journeys are a separate track
and would need their own evidence; this field is ENTRY-scoped.

`tested` is defined here so the ladder has a top rung, but **v0.5's
`audit-entry.mjs` does not produce it**: the script deliberately runs the static
claim only. A future runtime harness must produce a report before a row may
move to `tested`.

## 2. Rules that do not bend

1. **Record the highest level actually obtained.** A declaration is never
   relabelled as a check. A failed or blocked check is still a check: its
   `source` stays `checked`.
2. **No skipping.** `declared -> checked -> tested`. A runtime test does not
   excuse the static checks, and a row may not jump from `declared` to `tested`.
3. **Failure is evidence.** A checker `FAIL` maps to `failed` with
   `source: checked`; it is not hidden by resetting the row to `declared`.
4. **`blocked` is an evidence gap, not a package verdict.** It means the checker
   could not complete a mandatory check (or a requested runtime did not
   complete). It blocks the gate conservatively; it does not prove the package
   is broken.
5. **Version- and host-bound.** Evidence is for exactly one package version and
   one DSH host. A version bump resets the row to `declared`; a host change
   makes the old check historical, not current.
6. **No score.** Evidence never changes FLOW or BOOST, and ENTRY/FLOW/BOOST are
   never summed.

## 3. Field contract

```json
"evidence": {
  "source": "declared",
  "checkedAt": null,
  "host": null,
  "checker": null,
  "reportPath": null
}
```

```json
"evidence": {
  "source": "checked",
  "checkedAt": "2026-11-14T09:33:59.624Z",
  "host": "0.2.2-rc.3",
  "checker": "dsh-standards@1.6.10 (dsh-plugin-verify@0.1.0)",
  "reportPath": "evidence/dsh-plugin-guide/0.5.8/0.2.2-rc.3/2026-11-14T09-33-59-624Z/report.json"
}
```

| Field | Meaning |
|---|---|
| `source` | `declared` / `checked` / `tested` — the highest level actually obtained |
| `checkedAt` | UTC instant the checker finished; `null` for declared |
| `host` | **DSH host version** the checker anchored on (not the machine hostname); `null` for declared |
| `checker` | tool + scanner version; `null` for declared |
| `reportPath` | repo-relative path to the raw checker report, stored with SHA-256; `null` for declared |

Related fields:

- `standards.entry.status` — the effective ENTRY state for the row.
- `standards.entry.declaredStatus` — the author's claim that was overridden by a
  check. Present only when it differs from `status`. Example: author declared
  `runtime`, a static check produced `recognized`; `declaredStatus: "runtime"`
  keeps the claim visible without treating it as evidence.
- `standards.entry.evidence` (boolean) — the **author's** declared evidence flag
  copied from `package.json`. It is not HCB's evidence. Use `row.evidence` for
  provenance.
- `summary.evidence` — `{declared, checked, tested}` counts across rows.

The matrix is `schemaVersion: "0.5"`.

## 4. Checker -> HCB mapping

`audit-entry.mjs` uses this table; it is implemented in
`scripts/lib/evidence.mjs` and covered by `scripts/audit-entry.test.mjs`.

| Checker `conclusion.status` | Checker exit | HCB `standards.entry.status` | `evidence.source` | Notes |
|---|---:|---|---|---|
| `pass` | 0 | `recognized` | `checked` | no blocking FAIL, no warning |
| `warn` | 0 | `recognized` | `checked` | warning IDs stay in the report |
| `fail` | 1 | `failed` | `checked` | at least one blocking FAIL; gate becomes `blocked` |
| `incomplete` | 2 | `blocked` | `checked` | mandatory check did not run / runtime did not complete |
| checker could not run | other | no patch | — | audit error, CLI exits 3 |

A `pass` with `--entry-claim static` is `recognized`, not `static` and not
`runtime`. `--entry-claim runtime` is the only path to a runtime claim, and that
belongs to `tested`, not to this script. If a checker reports
`DSH-ENTRY static` (runtime claim without runtime evidence), the mapping records
`static`; a `checked` row may therefore be `recognized`, `static`, `failed`, or
`blocked`, but never `runtime`.

Known checker limitation (1.6.10): with a package profile, `C-3.5` is not
produced, so `coverage.entryBlocking.pass` can be `false` even when the
conclusion is `pass` (observed `prereq 5/6`). HCB records the conclusion and
keeps the entire `coverage.entryBlocking` block in the report; it does not turn
that gap into a pass claim.

## 5. Failure and `blocked` semantics

| State | Means | Gate | What to do |
|---|---|---|---|
| `failed` | The checker completed and found a blocking static ENTRY defect. | `blocked` | Read `report.buckets.blocking` and fix the package. |
| `blocked` | The checker could not establish a verdict: a mandatory check did not run, or a requested runtime/host did not complete. | `blocked` | Fix the environment/input and re-run; do not call it a package failure. |
| no patch (exit 3) | The audit itself could not run: `npm pack` failed, the checker crashed, output was not JSON, the anchor is suspect, or the subject does not match the tarball. | unchanged | Fix the audit; do not write a status. |

A `blocked` row is deliberately conservative: "we could not establish ENTRY"
must not become `pilot` or `production-candidate`. A `failed` row is a finding,
not an absence of evidence; its source remains `checked`.

## 6. Re-running an audit

Requirements: Node **>= 24.9** for `dsh-standards@1.6.10`; HCB itself supports
Node >= 20. The checker is pinned to `1.6.10` even when a newer release exists,
so results stay comparable; report bytes can still differ in the temporary
`subject.path` and timestamps.

```bash
# 1. confirm the checker CLI (once per environment)
npx -y dsh-standards@1.6.10 --help

# 2. dry run: pack, check, write report + patch, do not touch the matrix
node scripts/audit-entry.mjs dsh-plugin-guide

# 3. review evidence/<pkg>/<version>/<host>/<stamp>/patch.json, then merge
node scripts/audit-entry.mjs dsh-plugin-guide --merge

# 4. verify the matrix and the unit tests
npm run validate
npm test
```

Useful options:

```bash
# pin a package version and a host anchor
node scripts/audit-entry.mjs dsh-plugin-guide --version 0.5.8 --host-version 0.2.2-rc.3

# CI-friendly machine output (exit 1 = failed, 2 = blocked, 3 = audit error)
node scripts/audit-entry.mjs dsh-plugin-guide --json

# inspect the throwaway pack/unpack directory
node scripts/audit-entry.mjs dsh-plugin-guide --keep-temp
```

Default host anchor is `data/matrix.json#latestHost`. Default install spec is
`<name>@<packed-version>`; use `--no-install-spec` to omit it. `--merge` creates
`data/matrix.v0.4.backup.json` on first use and never overwrites an existing
backup. The merge writes through a temp file + rename (with a copy fallback where
rename-over-existing is unavailable) and refuses if the row version differs, if
the report bytes changed, or if the package is not in the matrix.

### Evidence layout

```text
evidence/<pkg>/<version>/<host>/<stamp>/
  report.json          raw dsh-conformance/1 report (the bytes that are hashed)
  pack.json            npm pack JSON (filename, shasum, integrity, unpackedSize)
  checker.stdout.json  duplicate of report.json for easy grepping
  checker.stderr.log   only when the checker wrote to stderr
  audit.json           command, Node/platform, checker exit, report SHA-256
  patch.json           hcb-evidence-patch/1 (before/after, evidence, report summary)
```

`report.subject.path` points at the throwaway unpack directory and is expected
to disappear. The report bytes, `pack.json` integrity, and `audit.json` are the
durable evidence.

## 7. What is **not** evidence

- A README badge, a CHANGELOG line, or an author's `dsh.standards` declaration.
- A local `node index.js` run with no DSH host; that is not a boot.
- `--no-exec`, `--static-only`, or partial coverage presented as a runtime pass.
- A checker report for a different package version, different host, or a
  different artifact (the merge checks the version; the report records the host).
- A `pass` conclusion with `entryBlocking.pass: false` presented as a fully
  checked ENTRY. The gap stays visible in `coverage.entryBlocking`.
- `standards.entry.evidence` used as if it were HCB evidence. It is the author's
  flag; `row.evidence` is the provenance record.

## 8. Staleness and demotion

- **Package version change:** `scripts/collect.mjs` preserves checked evidence
  only when the new `latest` equals the version that was audited. Any version
  bump resets the row to `declared`.
- **Host change:** `evidence.host` names the DSH version that was checked. When
  a newer host becomes `latestHost`, the evidence is historical. It is still
  `checked` for its recorded host, but it is **stale** for the new latest host
  until re-run.
- **Demotion:** merging a static check over a declared `runtime` changes the
  effective `standards.entry.status` to the checked result (`recognized`,
  `failed`, or `blocked`) and preserves the claim in `declaredStatus`. This is
  intentional: a claim is not evidence, and HCB must not show a declared
  `runtime` as if it had been tested.

## 9. Reproducibility and safety

- `npm pack` of the published artifact; the unpacked tree is never installed and
  no package lifecycle script is executed by this script.
- Tarball entries are rejected if absolute, drive-letter, or containing `..`;
  symlinks in the unpacked tree are rejected; unpacked size is capped at 64 MiB.
- The checker runs with `--entry-claim static`; it does not boot the plugin.
- Reports are stored with SHA-256; `--merge` re-hashes the report and refuses to
  write if the bytes changed after the audit.
- The temporary directory is removed unless `--keep-temp` is used.

## 10. File map

| File | Role |
|---|---|
| `scripts/audit-entry.mjs` | pack, check, write report/patch, optional merge |
| `scripts/lib/evidence.mjs` | evidence contract, mapping, patch application, summary refresh |
| `scripts/lib/gate.mjs` | shared `hcb-gate/1` implementation used by collector and merger |
| `scripts/migrate-v05.mjs` | one-shot v0.4 -> v0.5 field migration |
| `scripts/validate.mjs` | matrix, summary, evidence and gate consistency checks |
| `scripts/audit-entry.test.mjs` | unit tests for mapping and merge invariants |
| `schema/hcb.schema.json` | JSON Schema (v0.5) |
| `docs/EVIDENCE.md` | this document |
