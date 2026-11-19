# Scope, resource limits, and security

The first standalone release ports the typed, fixture-tested **virtual cube core**, not a complete online analytical database or VizHub dataset service.

## Resource bounds

The imported `UDC_LIMITS` are deliberately conservative:

| Budget                                 |  Value |
| -------------------------------------- | -----: |
| Cube inputs in current integration API |      2 |
| Rows per source cube                   | 10,000 |
| Columns per source                     |    100 |
| Output observations                    | 10,000 |
| Input CSV/TSV size                     |  2 MiB |

Inputs over budget fail rather than silently truncating. These limits are not a streaming guarantee or protection from all potentially expensive workloads.

## Not implemented

- Dataset HTTP fetching, downloadable semantic manifests or an automatic browser loader
- Joins with unequal dimensions, left/full joins, aggregation, projections or unit conversions
- Semantic inference, codelist auto-approval, hierarchy editing or persistent semantic governance
- Public/private source authorization, access tokens, tenant policy or cross-origin proxying
- Multi-cube execution planning, database pushdown, large files or Arrow/Parquet parsing
- Persisted materialized cubes or remote registry/database APIs

## Security boundaries

**The calling application must enforce permissions before returning source bytes, schemas, mapping evidence or private provenance.** A dataset hash or snapshot ID alone is not sufficient authorization. Client code cannot keep private data secret after delivery to a browser. No library operation should infer global permission from a shared source identity.

Callers must explicitly approve mapping semantics and version pins; do not use unreviewed identifiers as exact matches. The package does not make network requests on its own. When fetching user-controlled URLs, validate domains, CORS, credentials and response size in the host.

Use this package for bounded datasets and reproducible visualizations. Large analytical jobs can use a server or database without changing the semantic model.
