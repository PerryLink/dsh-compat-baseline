# Evidence reports

This directory holds raw, reproducible ENTRY checker reports referenced by
`row.evidence.reportPath` in `data/matrix.json`.

Layout:

```text
evidence/<pkg>/<version>/<host>/<stamp>/
  report.json          raw dsh-conformance/1 report
  pack.json            npm pack JSON (shasum / integrity / size)
  checker.stdout.json  copy of report.json for grepping
  checker.stderr.log   only when non-empty
  audit.json           command, Node/platform, checker exit, report SHA-256
  patch.json           hcb-evidence-patch/1 (before/after, evidence, summary)
```

Rules:

- A report is evidence for exactly one package version and one DSH host.
- `reportPath` in the matrix is repository-relative and must remain readable.
- Do not hand-edit a report. Re-run `scripts/audit-entry.mjs` instead.
- `report.subject.path` points at a throwaway unpack directory; it is expected
  to disappear. The report bytes, `pack.json` integrity, and `audit.json` are
  the durable evidence.
- Dry-run reports are kept here too, but a report only becomes `checked`
  evidence when its patch is merged into `data/matrix.json`.

See [`../docs/EVIDENCE.md`](../docs/EVIDENCE.md) for the full contract.
