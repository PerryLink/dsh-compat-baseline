# Use HCB in CI

Add this to any plugin repo:

```yaml
name: hcb
on: [push, pull_request]
jobs:
  compat:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: PerryLink/hcb/.github/actions/check@main
        with:
          package: your-npm-package
          # host: 0.2.2-rc.3   # optional; default = latest in HCB
          # fail-on: declared-incompatible
```

Notes:

- `unknown` never fails; it prints a warning so you can add `engines.dsh`.
- `declared-incompatible` fails by default; set `fail-on: never` for a report-only mode.
- The action reads `data/matrix.json` from `main`; pin a tag if you need stability.
- It also prints the three tracks and the gate; no total score.
- This is a **declared** check, not a test run.
