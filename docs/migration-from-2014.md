# Migration from the 2014 UDC prototype

The original `curran/udc` library was written for RequireJS/AMD and bundled via Gulp and Bower. Its code and annotated HTML documentation remain on the historical `gh-pages` branch. This branch is a modern ESM/TypeScript reimplementation, **not a source-compatible major upgrade**.

| 2014 API                               | Modern equivalent                                                                 |
| -------------------------------------- | --------------------------------------------------------------------------------- |
| `udc.createCube(dataset)`              | `createCube(rows, semanticSchema, snapshot)`                                      |
| `getMember(dimension, codelist, code)` | `codedRef(...)` for source identity, `canonicalMember(...)` for semantic identity |
| `getCell(members)`                     | `getCellKey({ members })`                                                         |
| `createThesaurus(tables)`              | `resolveConcordance(explicitMappings, context)`                                   |
| `mergeCubes(a,b,thesaurus)`            | `canonicalizeCube` on each, then `integrateCubes(a,b)`                            |
| `slice(cube,member)`                   | `sliceCube(cube,canonicalMember)`                                                 |
| `Hierarchy`, `mergeHierarchies`        | Not yet implemented                                                               |

The previous join implementation chose the left source's cells and could overwrite conflicting measures. Modern UDC performs a strict inner join with explicit dimension and measure conflict errors. Historical process-local object IDs are replaced by durable coordinate keys; fuzzy and unverified equivalences are never silently used.

Run `npm run example` and `npm test` to verify the original UN population / World Bank GDP integration against imported fixtures. A legacy test with incorrect `.key` assertions is not copied into the modern suite; semantic behavior is covered by corrected golden assertions.

The historical `gh-pages` branch is intentionally untouched by this modernization. No deprecated AMD code is published in the new npm tarball.
