# Public API

All documented functions and types are exported from `@vizhub/udc` and `src/index.ts`. The source contains zero server/framework imports.

| Export | Signature / behavior |
| --- | --- |
| `parseTabular` | `(text: string, format: "csv" \| "tsv") => TabularRows` |
| `createCube` | `(rows, semanticSchema, datasetSnapshot) => SourceCube` |
| `getCellKey` | `(coordinate) => CellKey` with stable `udc-cell-v1:` prefix |
| `codedRef` | Create `CodedMemberRef` for dimension/codelist/revision/code |
| `canonicalMember` | Create canonical `Member` for dimension/member ID |
| `resolveConcordance` | `(mappings, {revision, at?}) => Concordance` |
| `canonicalizeCube` | `(source, concordance) => CanonicalCube` |
| `integrateCubes` | `(a, b, {join:"inner"}) => CanonicalCube` |
| `sliceCube` | `(cube, member) => CanonicalCube` |
| `UDC_LIMITS` | Exported resource ceilings; see [limits](limitations.md) |
| `UdcError` | Typed exception with `code` |

`SemanticSchema` maps input columns to explicit `DimensionFieldMapping` and `MeasureFieldMapping` definitions. `MeasureDefinition` carries an ID, name and unit; each field mapping carries a scale. UDC does not infer column semantics.

The `Resolution` result of a concordance has distinct `resolved`, `unresolved` and `conflict` statuses. Do not treat failure as an inferred match.

**Compatibility:** The 2014 functions `getMember`, `getCell`, `createThesaurus`, `mergeCubes`, `Hierarchy`, and `mergeHierarchies` are **not** provided as drop-in aliases. See [migration notes](migration-from-2014.md). Public stable semantic contracts should be versioned before introducing additional joins, aggregation, loader APIs or manifest formats.
