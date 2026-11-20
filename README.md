# Universal Data Cube (UDC)

A small, framework-independent TypeScript library for **semantic integration of tabular datasets**. UDC represents observations as measures at coordinates, reconciles coded dimension members through explicit, versioned concordances, and preserves per-measure source provenance.

This is the modern continuation of [Curran Kelleher's original 2014 Universal Data Cube project](https://github.com/curran/udc/tree/gh-pages). The previous AMD/RequireJS version, tests, and annotated documentation are preserved on the historical `gh-pages` branch. The new implementation imports the typed in-memory core and pure golden tests developed in VizHub AI Studio, with provider-neutral snapshot identifiers.

> **Release status:** `@vizhub/udc@1.0.0` is published on npm. The new aggregation-aware API is prepared for `2.0.0` and is not available from npm until a separately verified release. The package contains **no network loader, database, UI, backend API, or VizHub authentication logic**.

## Start developing

Requires Node.js 22 or newer.

```bash
npm install
npm run check
npm run example
```

The example loads bundled sample CSVs for UN population, World Bank GDP, and country-code concordances and prints joined observations. No VizHub server or credentials are required.

After npm publication, application consumers can install `@vizhub/udc` and import its named functions.

## Quick start

```ts
import { parseTabular, createCube } from "@vizhub/udc";

const csv = "country,year,population\nCHN,1960,650680114\n";
const rows = parseTabular(csv, "csv");

const cube = createCube(
  rows,
  {
    id: "population-schema",
    revision: "v1",
    dimensions: [
      {
        field: "country",
        dimension: { id: "country", name: "Country" },
        codelist: { id: "iso-alpha3", revision: "v1" },
      },
      {
        field: "year",
        dimension: { id: "year", name: "Year" },
        codelist: { id: "calendar-year", revision: "v1" },
      },
    ],
    measures: [
      {
        field: "population",
        measure: {
          id: "population",
          name: "Population",
          unit: "persons",
          aggregation: "sum",
        },
        scale: 1,
      },
    ],
  },
  { datasetId: "population-1960", revision: "v1" },
);
```

`createCube` produces a **SourceCube** with coded coordinates. To combine sources, build a concordance from explicitly verified exact mappings, call `canonicalizeCube` on both source cubes, then `integrateCubes`. See [the runnable population/GDP example](examples/population-gdp.mjs) for the complete workflow.

## Operations

| Function                                    | Purpose                                                    |
| ------------------------------------------- | ---------------------------------------------------------- |
| `parseTabular(text, "csv" \| "tsv")`        | Bounded record-aware parser                                |
| `createCube(rows, schema, snapshot)`        | Create a typed SourceCube with measure provenance          |
| `codedRef`, `canonicalMember`, `getCellKey` | Portable and order-invariant coordinate identities         |
| `resolveConcordance(mappings, context)`     | Verified exact-equivalence closure with conflicts          |
| `canonicalizeCube(source, concordance)`     | Translate coded coordinates to canonical member identities |
| `integrateCubes(a, b)`                      | Strict inner join over identical canonical dimensions      |
| `aggregateCube(cube, keepDimensions)`       | Explicit, provenance-preserving sum/count/average roll-ups |
| `sliceCube(cube, member)`                   | Select a member and remove its dimension                   |

The implementation deliberately rejects unknown or non-equivalent identifiers, duplicate measure identities, incompatible grains, ambiguous mappings and over-budget operations. There is no guesswork or implicit aggregation.

## Documentation

- [Quick start](docs/quickstart.md)
- [Concepts and data model](docs/concepts.md)
- [API reference](docs/api.md)
- [Scope, limits, and security](docs/limitations.md)
- [Migrating from UDC 2014](docs/migration-from-2014.md)
- [Contributing](CONTRIBUTING.md) · [Security reporting](SECURITY.md) · [Change log](CHANGELOG.md)

## Relationship to VizHub

UDC is useful without VizHub. Visualization and data platforms may supply their own CSV/TSV bytes, schema revisions, reviewed mappings and provenance. In VizHub AI Studio, authorization, project membership and registry-source access must remain in the hosting application; the standalone library **does not perform authorization**. A source hash is an identity, not an access token.

UDC is MIT-licensed. See [LICENSE](LICENSE) and [NOTICE.md](NOTICE.md).
