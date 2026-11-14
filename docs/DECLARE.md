# Declare your tracks in `package.json`

HCB reads `dsh.standards` from your published package. **Only 3 of 143 plugins currently declare it (2026-11-14).** Adding it is a one-line investment; it lets users and CI see which tracks you actually ran.

## Template

```json
{
  "dsh": {
    "standards": {
      "schema": "dsh-levels/1",
      "entry": { "status": "not-run", "evidence": null },
      "flow":  { "status": "not-run", "evidence": null },
      "boost": { "status": "not-measured", "evidence": null }
    }
  }
}
```

Replace `not-run` / `not-measured` only when you have evidence:

| Track | Allowed status | Claim only when |
|---|---|---|
| `entry` | `runtime` / `recognized` / `static` / `blocked` / `failed` / `not-run` / `stale` | `runtime` requires G0–G3 (real boot, target row ACTIVE/disabled) |
| `flow` | `runtime` / `manual` / `not-run` / `failed` / `stale` | `runtime`/`manual` requires J1–J8 evidence |
| `boost` | `measured` / `not-measured` / `failed` / `stale` | `measured` requires a LEV evidence card |

## Run the checker

```bash
# from dsh-standards (npm package 1.6.10)
npx -y dsh-standards@1.6.10 check ./my-plugin
npx -y dsh-standards@1.6.10 ./my-plugin --scope entry --entry-claim static --format json
```

The checker writes `not-run` for anything it did not run; HCB preserves that. **A skip is not a pass.**

Adding this declaration makes your row `declared`, not `checked`. To get
independent `checked` evidence, HCB must run `scripts/audit-entry.mjs` against
the published tarball; see [`EVIDENCE.md`](EVIDENCE.md).

## What HCB does with it

- Shows `entry` / `flow` / `boost` as separate columns, plus the row's `evidence.source`.
- Never sums them into a score.
- Never uses `boost` as a gate.
- Adds compatibility + capability risk + a `review` recommendation.

Canonical model: [dsh-standards/spec/levels.json](https://github.com/PerryLink/dsh-standards/blob/main/spec/levels.json).
