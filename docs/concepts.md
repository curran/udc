# Data model and semantics

UDC treats **dimensions** as identifying axes (e.g., Country, Year), **measures** as typed quantitative properties (e.g., Population in persons), and **observations** as measure values at an order-independent coordinate.

## Declared measure aggregation

Each measure declares a mandatory canonical `unit` and `aggregation`: `sum`, `count`, `average`, or `none`. `none` prohibits roll-up instead of silently choosing an operation. `count` means counting non-null observations (not summing a count-valued measure). The unit of a derived count is observations, unlike the input physical unit. `sum` and `average` work on values in the declared unit. This release records policy only: integration and slicing do not implicitly aggregate. Change the schema revision when these definitions change.

## Source versus canonical cubes

A `SourceCube` stores `CodedMemberRef` values containing a dimension ID, code-list ID and revision, and literal source code. A `CanonicalCube` stores stable `Member` identities. A code such as UN M49 `156` and ISO alpha-3 `CHN` cannot be joined merely because they look compatible. Reviewed exact mappings can resolve both to one canonical `country:china` identity.

Coordinates use a stable, version-prefixed `udc-cell-v1:` key. They do not depend on process-local incrementing IDs or input member ordering.

## Reproducibility and provenance

Each `MeasureValue` retains a `MeasureProvenance` record: source `DatasetSnapshot`, original row index, source-coded coordinate, schema revision, measure ID, unit, and (after canonicalization) concordance and mapping revisions.

For standalone callers, the required `DatasetSnapshot` field is `datasetId`. `revision` and `sourceId` are optional generic identifiers. `vizId`, `commitId`, and `sourceKey` are optional fields for existing VizHub integration. These are identities and provenance, **not authorization grants**. IDs use bounded safe identifier syntax, not arbitrary URLs.

## Concordance policy

Only exact, verified edges form equivalence classes. A class requires one unambiguous canonical assignment. Unverified, close, related, broader and narrower mappings are deliberately excluded. Effective-dated mappings require an explicit query date. Contradictions yield conflict or unresolved results.

## Explicit aggregation

`aggregateCube(cube, retainedDimensionIds)` is an explicit roll-up over canonical coordinates. It does not infer dimension hierarchies or silently run during integration/slicing. A measure's required `aggregation` declaration controls reduction: `sum`, `average`, `count`, or `none`. `none` rejects groups containing multiple observations. Nulls are excluded from arithmetic; empty sums and averages yield null, whereas count yields zero. Zero is never treated as missing.

The result is an `AggregatedCube`, distinct from a `CanonicalCube`; its values retain all contributing original source-row provenance and sufficient `sum`/`count` state for a later roll-up. Averages of unequal-sized groups are recomputed using that state, not averaged as unweighted means. A `count` operation creates a derived `:count` measure in `observations` units whose later roll-ups use `sum`. All resulting measure metadata and coordinates are deterministic. Runtime row and output limits still apply.

No hierarchy lookup, source-unit conversion, weighted rate calculation, implicit roll-up, or SQL is performed by this operation.

## Integration and slicing

`integrateCubes` performs an **inner join only** between canonical cubes with the same dimension set and granularity. It refuses duplicate measure IDs. `sliceCube` selects observations at one canonical member and removes the selected axis, preserving measure lineage. Neither operation implicitly aggregates or fills missing values.

See [the full API reference](api.md) and [documented limits](limitations.md).
