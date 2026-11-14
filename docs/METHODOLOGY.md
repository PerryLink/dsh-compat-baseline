# Methodology (v0.5)

## Scope
Declared compatibility + declared adoption tracks for DeepSeek Harness (DSH) plugins. A row is a plugin version; columns are recent DSH releases plus three independent tracks.

## Sources
1. **Host**: `GET /repos/deepseek-ai/deepseek-harness/releases` (tag → semver).
2. **Plugin**: npm registry `/<pkg>` → `dist-tags.latest`, `engines.dsh`, `peerDependencies["@deepseek-ai/dsh"]`, `dsh.capabilities`, `dsh.manifestVersion`, `dsh.standards`, `time`.
3. **Downloads**: `api.npmjs.org/downloads/point/last-week/<pkg>`.
4. **Tracks**: `dsh.standards` follows `dsh-levels/1` from [dsh-standards](https://github.com/PerryLink/dsh-standards). Missing → `unknown`/`not-declared`.
5. **Evidence**: `row.evidence` records how the ENTRY state was obtained (`declared` / `checked` / `tested`). `checked` means a named checker ran against the packed tarball; it is not a boot. See `docs/EVIDENCE.md`.

## Compatibility status
- `declared-compatible`: `semver.satisfies(host, range, {includePrerelease:true})`.
- `declared-incompatible`: range valid but host outside.
- `unknown`: no range or invalid range.

## Track status
- `entry`: runtime / recognized / static / blocked / failed / not-run / stale / unknown.
- `flow`: runtime / manual / not-run / failed / stale / unknown.
- `boost`: measured / not-measured / failed / stale / unknown.

**No composite score.** A skip is not a pass; static is not runtime; BOOST is not a gate. `declared` is not `checked`; `checked` is not `tested`.

## Risk
Capability strings are bucketed:
- high: `subprocess`, `fs:write`, `shell`, `exec`, `listen`, `process`, `danger`.
- medium: `network:egress`, `fs:read`, `sessions:read`, `tools:register`, `client:*`.
- low: capabilities present but none of the above.
- unknown: no capability manifest.

## Gate
`hcb-gate/1` is a compatibility/risk heuristic, not a quality grade. See `docs/TRACKS.md`.

## Limitations
- npm metadata is self-reported.
- Declared ranges may be wrong. v0.5 adds a `checked` static evidence layer; a runtime `tested` matrix is future work.
- `dsh.standards` adoption is currently near-zero; `not-declared` is the norm.
- Not a security audit; capability manifest ≠ actual behavior.
