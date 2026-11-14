# Changelog

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
