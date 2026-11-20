# Change log

## Unreleased — Explicit cube roll-ups

- Add `aggregateCube` to reduce canonical coordinates by declared sum, count and average operators.
- Preserve original per-value source lineage and sufficient statistics to make repeated averages correct.
- Keep aggregated cubes a distinct stage and reject inappropriate non-additive roll-ups.

## Unreleased — Measure aggregation semantics

- Require a measure aggregation policy: `sum`, `count`, `average`, or `none`.
- Reject undeclared or unsupported operators without silently aggregating.
- Keep canonical measure `unit` mandatory; changing schemas is required for consumers.

## 0.1.0 — Unreleased

- Modern TypeScript ESM reimplementation of Universal Data Cube extracted from VizHub AI Studio.
- Typed SourceCube/CanonicalCube, versioned concordance, deterministic cell keys, strict inner join, slicing, and measure provenance.
- Record-aware CSV and TSV parsing using d3-dsv with bounded inputs.
- Ported golden UN population and World Bank GDP tests and integration edge suites.
- Provider-neutral dataset snapshot support and standalone package tooling.
- This is **not** backward source-compatible with the 2014 AMD implementation.
