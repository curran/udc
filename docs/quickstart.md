# Quick start

UDC is a **pure computation library**. It does not fetch URLs or discover a cloud catalog. Read bytes yourself, then pass decoded CSV/TSV text to `parseTabular`.

```ts
import { parseTabular, createCube } from "@vizhub/udc";

const response = await fetch("/data/population.csv");
if (!response.ok) throw new Error("Dataset unavailable");
const rows = parseTabular(await response.text(), "csv");

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
  { datasetId: "population-2026", revision: "2026-01" },
);
```

The resulting `SourceCube` retains original **coded** members. For integration:

1. Provide explicitly reviewed `CodeMapping` records that assign coded source members to stable canonical members.
2. Build a resolver using `resolveConcordance(mappings, { revision })`, optionally specifying `at` for effective-dated mappings.
3. Call `canonicalizeCube(source, resolver)` for each source.
4. Call `integrateCubes(a, b)` for strict matching dimension sets, and optionally `sliceCube(result, member)`.

Run `npm run example` for a real UN population × World Bank GDP example, including two different country-code systems.

### Browser delivery

The library works with ordinary `fetch`, `d3.csv`, or an application's existing authenticated dataset proxy. The hosting application owns access control and CORS behavior. Do not put secrets or private data in a publicly published JavaScript bundle. UDC currently has **no** first-party `loadCube(url)` API; a separate client SDK can provide that contract later.
