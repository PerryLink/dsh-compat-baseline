# Methodology (v0.1)

## Scope
Declared compatibility for DeepSeek Harness (DSH) plugins. A row is a plugin version; columns are recent DSH releases.

## Sources
1. **Host**: `GET /repos/deepseek-ai/deepseek-harness/releases` (tag → semver).
2. **Plugin**: npm registry `/<pkg>` → `dist-tags.latest`, `engines.dsh`, `peerDependencies["@deepseek-ai/dsh"]`, `dsh.capabilities`, `dsh.manifestVersion`, `time`.
3. **Downloads**: `api.npmjs.org/downloads/point/last-week/<pkg>`.

## Status
- `declared-compatible`: `semver.satisfies(host, range, {includePrerelease:true})`.
- `declared-incompatible`: range is valid but host is outside it.
- `unknown`: no range, or invalid range.

**A declared-compatible row is a claim by the package author, not a test result.** Do not present it as "works".

## Stale rule
A plugin is **stale** when it declares no range, or its latest version is declared-incompatible with the latest host. v0.3 will add "last publish > 90 days" as a second stale signal.

## Reproducibility
`scripts/collect.mjs` is deterministic given the same registry/release state. The generated `generatedAt` timestamp changes. Pin a commit for citation.

## Limitations
- npm metadata is self-reported.
- Pre-release semver ranges are messy; `includePrerelease` is used consistently.
- No test execution in v0.1.
- Not a security audit.
