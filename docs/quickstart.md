# Quick start

UDC is a **pure computation library**. It accepts structured rows and does not fetch URLs, discover catalogs, or parse CSV/TSV. Parse data in the calling application with any library you prefer.

```ts
import { csvParse } from "d3-dsv"; // optional application dependency
import { createCube } from "@vizhub/udc";

const response = await fetch("/data/population.csv");
if (!response.ok) throw new Error("Dataset unavailable");
const rows = csvParse(await response.text());

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

`d3-dsv` in this example is installed by the application, not by UDC. You can instead pass data from another parser, an API, or a database directly to `createCube`.

The resulting `SourceCube` retains original **coded** members. For integration:

1. Provide explicitly reviewed `CodeMapping` records that assign coded source members to stable canonical members.
2. Build a resolver using `resolveConcordance(mappings, { revision })`, optionally specifying `at` for effective-dated mappings.
3. Call `canonicalizeCube(source, resolver)` for each source.
4. Call `integrateCubes(a, b)` for strict matching dimension sets, and optionally `sliceCube(result, member)`.

Run `npm run example` for a real UN population × World Bank GDP example, including two different country-code systems.

### Browser delivery

The library works with ordinary `fetch`, `d3.csv`, or an application's existing authenticated dataset proxy. The hosting application owns access control and CORS behavior. Do not put secrets or private data in a publicly published JavaScript bundle. UDC currently has **no** first-party `loadCube(url)` API; a separate client SDK can provide that contract later.
