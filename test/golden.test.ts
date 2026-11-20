import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import {
  createCube,
  canonicalizeCube,
  integrateCubes,
  sliceCube,
  resolveConcordance,
  codedRef,
  canonicalMember,
  getCellKey,
  parseTabular,
  type SemanticSchema,
  type CodeMapping,
  type DatasetSnapshot,
} from "../src/index";

const fixture = (name: string) =>
  readFileSync(new URL("./fixtures/" + name, import.meta.url), "utf8");
const population = fixture("total_population.csv");
const gdp = fixture("GDP_current_USD.csv");
const location = fixture("locations.csv");
const country = { id: "country", name: "Country" };
const year = { id: "year", name: "Year" };
const yearCodes = { id: "calendar-year", revision: "2014" };
const popSchema: SemanticSchema = {
  id: "schema:un-population",
  revision: "v1",
  dimensions: [
    {
      field: "countryCode",
      dimension: country,
      codelist: { id: "un-m49", revision: "2014" },
    },
    { field: "year", dimension: year, codelist: yearCodes },
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
      scale: 1000,
    },
  ],
};
const gdpSchema: SemanticSchema = {
  id: "schema:wb-gdp",
  revision: "v1",
  dimensions: [
    {
      field: "countryCode",
      dimension: country,
      codelist: { id: "iso-alpha3", revision: "2014" },
    },
    { field: "year", dimension: year, codelist: yearCodes },
  ],
  measures: [
    {
      field: "gdp",
      measure: {
        id: "gdp-current-usd",
        name: "GDP (current US$)",
        unit: "USD",
        aggregation: "sum",
      },
      scale: 1,
    },
  ],
};
const snapshot = (text: string, vizId: string): DatasetSnapshot => ({
  datasetId: "ds_c_" + createHash("sha256").update(text).digest("hex"),
  vizId,
  commitId: "commit:original-2014",
  sourceKey: "source:" + vizId,
});
const un = snapshot(population, "viz:un");
const wb = snapshot(gdp, "viz:wb");
function exact(
  source: ReturnType<typeof codedRef>,
  canonical: ReturnType<typeof canonicalMember>,
): CodeMapping {
  return {
    source,
    canonical,
    relationship: "exact",
    verified: true,
    revision: "map:2014",
    provenance: "2014 UDC locations.csv / fixture",
  };
}
const mappings: CodeMapping[] = [];
for (const row of parseTabular(location, "csv")) {
  const id =
    row.countryName === "United States of America"
      ? "usa"
      : row.countryName.toLowerCase();
  const canonical = canonicalMember("country", "country:" + id);
  mappings.push(
    exact(codedRef("country", "un-m49", "2014", row.unCountryCode), canonical),
  );
  mappings.push(
    exact(codedRef("country", "iso-alpha3", "2014", row.alphaCode), canonical),
  );
}
for (const code of ["1960", "2010"])
  mappings.push(
    exact(
      codedRef("year", "calendar-year", "2014", code),
      canonicalMember("year", "year:" + code),
    ),
  );
function integrated() {
  const concordance = resolveConcordance(mappings, {
    revision: "concordance:fixtures-v1",
  });
  const a = canonicalizeCube(
    createCube(parseTabular(population, "csv"), popSchema, un),
    concordance,
  );
  const b = canonicalizeCube(
    createCube(parseTabular(gdp, "csv"), gdpSchema, wb),
    concordance,
  );
  return { cube: integrateCubes(a, b), concordance };
}
describe("2014 UDC UN population × World Bank GDP acceptance", () => {
  it("resolves UN M49 156 and ISO CHN to the same canonical country", () => {
    const { concordance } = integrated();
    expect(
      concordance.resolve(codedRef("country", "un-m49", "2014", "156")),
    ).toMatchObject({
      status: "resolved",
      member: canonicalMember("country", "country:china"),
    });
    expect(
      concordance.resolve(codedRef("country", "iso-alpha3", "2014", "CHN")),
    ).toMatchObject({
      status: "resolved",
      member: canonicalMember("country", "country:china"),
    });
  });
  it("integrates China 1960 with unit scaling and both source histories", () => {
    const { cube } = integrated();
    expect(cube.observations).toHaveLength(6);
    const key = getCellKey({
      members: [
        canonicalMember("year", "year:1960"),
        canonicalMember("country", "country:china"),
      ],
    });
    const obs = cube.observations.find((x) => x.cellKey === key);
    expect(obs).toBeDefined();
    expect(obs!.values.population.value).toBeCloseTo(650680114, 3);
    expect(obs!.values["gdp-current-usd"].value).toBeCloseTo(
      61377930682.0013,
      3,
    );
    expect(obs!.values.population.provenance).toMatchObject({
      snapshot: un,
      sourceRow: 3,
      schemaId: popSchema.id,
      schemaRevision: "v1",
      measureId: "population",
      unit: "persons",
      concordanceRevision: "concordance:fixtures-v1",
      mappingRevisions: ["map:2014"],
    });
    expect(obs!.values["gdp-current-usd"].provenance).toMatchObject({
      snapshot: wb,
      sourceRow: 3,
      schemaId: gdpSchema.id,
      schemaRevision: "v1",
      measureId: "gdp-current-usd",
      unit: "USD",
      concordanceRevision: "concordance:fixtures-v1",
      mappingRevisions: ["map:2014"],
    });
    expect(
      obs!.values.population.provenance.sourceCoordinate.members[0].code,
    ).toBe("156");
    expect(
      obs!.values["gdp-current-usd"].provenance.sourceCoordinate.members[0]
        .code,
    ).toBe("CHN");
    expect(cube.concordanceRevisions).toEqual(["concordance:fixtures-v1"]);
    expect(cube.snapshots).toEqual([un, wb]);
  });
  it("replays identically and slices Year 1960 to Country-only observations", () => {
    const first = integrated().cube,
      second = integrated().cube;
    expect(JSON.stringify(first)).toEqual(JSON.stringify(second));
    const sliced = sliceCube(first, canonicalMember("year", "year:1960"));
    expect(sliced.dimensions).toEqual([country]);
    expect(sliced.observations).toHaveLength(3);
    const china = sliced.observations.find(
      (x) =>
        x.cellKey ===
        getCellKey({ members: [canonicalMember("country", "country:china")] }),
    );
    expect(china?.values.population.value).toBeCloseTo(650680114);
    expect(china?.values["gdp-current-usd"].provenance.snapshot).toEqual(wb);
  });
});
