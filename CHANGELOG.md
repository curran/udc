# Change log

## Unreleased — breaking removal of CSV/TSV parser

- Remove `parseTabular`, `TabularRows`, and the parser-only `UDC_LIMITS.fileBytes` from the public API. Callers now pass pre-parsed records to `createCube`.
- Move `d3-dsv` to development-only use in tests and the example; UDC has zero production dependencies.
- **Release note:** Removing public exports is a breaking change and requires a new major version on publication.

## 1.2.0 — Unreleased (breaking aggregation metadata)

- Declare `aggregation` mandatory on every measure; existing `1.0.0` consumers need explicit migrations.
- Add explicit, provenance-preserving `aggregateCube` with composable averages and derived counts.
- Add `AggregatedCube` as a distinct result stage with original per-value lineage and sufficient statistics.
- Require a measure aggregation policy: `sum`, `count`, `average`, or `none`; reject undeclared or unsupported operators without silently aggregating.
- Keep canonical measure `unit` mandatory; changing schemas is required for consumers.
- Build `dist/` during `prepublishOnly` so the published tarball always matches the verified source.
- Update package release metadata and add a reproducible manual/tag release workflow.

## 1.1.0 — Published

- Published package metadata update. The published artifact did not include the aggregation-aware API; use `1.2.0` for those features.

## 1.0.0 — Published

- First standalone npm release of the modern TypeScript ESM core.

## 0.1.0 — Unreleased

- Modern TypeScript ESM reimplementation of Universal Data Cube extracted from VizHub AI Studio.
- Typed SourceCube/CanonicalCube, versioned concordance, deterministic cell keys, strict inner join, slicing, and measure provenance.
- Record-aware CSV and TSV parsing using d3-dsv with bounded inputs.
- Ported golden UN population and World Bank GDP tests and integration edge suites.
- Provider-neutral dataset snapshot support and standalone package tooling.
- This is **not** backward source-compatible with the 2014 AMD implementation.
