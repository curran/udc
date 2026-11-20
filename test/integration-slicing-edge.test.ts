import { describe, expect, it } from "vitest";
import {
  canonicalizeCube,
  canonicalMember,
  codedRef,
  createCube,
  getCellKey,
  integrateCubes,
  resolveConcordance,
  sliceCube,
  UDC_LIMITS,
  UdcError,
  type CodeMapping,
  type DatasetSnapshot,
  type DimensionFieldMapping,
  type SemanticSchema,
} from "../src/index";

const country = { id: "country", name: "Country" };
const year = { id: "year", name: "Year" };
const industry = { id: "industry", name: "Industry" };
const dimensions: DimensionFieldMapping[] = [
  {
    field: "countryCode",
    dimension: country,
    codelist: { id: "m49", revision: "2020" },
  },
  {
    field: "yearCode",
    dimension: year,
    codelist: { id: "calendar-year", revision: "1" },
  },
  {
    field: "industryCode",
    dimension: industry,
    codelist: { id: "naics", revision: "2022" },
  },
];

const snapshot = (measureId: string): DatasetSnapshot => ({
  datasetId: "ds_c_" + (measureId === "population" ? "a" : "b").repeat(64),
  vizId: "viz-" + measureId,
  commitId: "commit-1",
  sourceKey: "source-" + measureId,
});
const schema = (
  measureId: string,
  unit: string,
  axes: readonly DimensionFieldMapping[] = dimensions,
): SemanticSchema => ({
  id: "schema-" + measureId,
  revision: "1",
  dimensions: axes,
  measures: [
    {
      field: "value",
      measure: { id: measureId, name: measureId, unit, aggregation: "sum" },
      scale: 1,
    },
  ],
});

type Row = {
  countryCode: string;
  yearCode: string;
  industryCode: string;
  value: string;
};
const row = (
  countryCode: string,
  yearCode: string,
  industryCode: string,
  value: string,
): Row => ({ countryCode, yearCode, industryCode, value });
const exact = (
  dimensionId: string,
  codelistId: string,
  revision: string,
  code: string,
  memberId: string,
): CodeMapping => ({
  source: codedRef(dimensionId, codelistId, revision, code),
  canonical: canonicalMember(dimensionId, memberId),
  relationship: "exact",
  verified: true,
  revision: "mapping-1",
  provenance: "unit fixture",
});
const concordance = resolveConcordance(
  [
    exact("country", "m49", "2020", "156", "country:china"),
    exact("country", "m49", "2020", "840", "country:usa"),
    exact("year", "calendar-year", "1", "1960", "year:1960"),
    exact("year", "calendar-year", "1", "2010", "year:2010"),
    exact("industry", "naics", "2022", "11", "industry:agriculture"),
    exact("industry", "naics", "2022", "31", "industry:manufacturing"),
  ],
  { revision: "concordance-1" },
);

const cube = (
  measureId: string,
  rows: Row[],
  axes: readonly DimensionFieldMapping[] = dimensions,
) =>
  canonicalizeCube(
    createCube(
      rows,
      schema(measureId, measureId === "population" ? "persons" : "USD", axes),
      snapshot(measureId),
    ),
    concordance,
  );
const key = (countryId: string, yearId: string, industryId: string) =>
  getCellKey({
    members: [
      canonicalMember("country", countryId),
      canonicalMember("year", yearId),
      canonicalMember("industry", industryId),
    ],
  });
const expectCode = (operation: () => unknown, expected: UdcError["code"]) => {
  try {
    operation();
    throw new Error("Expected a UDC error");
  } catch (error) {
    expect(error).toBeInstanceOf(UdcError);
    expect((error as UdcError).code).toBe(expected);
  }
};

describe("UDC integration edge cases", () => {
  it("inner joins only overlapping three-dimensional coordinates, retaining nulls and independent measure provenance", () => {
    const population = cube("population", [
      row("156", "1960", "11", ""),
      row("156", "2010", "11", "12"),
      row("840", "1960", "31", "-5"),
    ]);
    const gdp = cube("gdp", [
      row("156", "1960", "11", "20"),
      row("840", "1960", "31", ""),
      row("840", "2010", "31", "17"),
    ]);
    const result = integrateCubes(population, gdp);
    const chinaKey = key("country:china", "year:1960", "industry:agriculture");
    const usaKey = key("country:usa", "year:1960", "industry:manufacturing");
    expect(result.observations.map((o) => o.cellKey)).toEqual(
      [chinaKey, usaKey].sort(),
    );
    expect(result.measures.map((m) => m.id)).toEqual(["population", "gdp"]);
    const china = result.observations.find((o) => o.cellKey === chinaKey)!;
    const usa = result.observations.find((o) => o.cellKey === usaKey)!;
    expect(china.values.population.value).toBeNull();
    expect(china.values.gdp.value).toBe(20);
    expect(usa.values.population.value).toBe(-5);
    expect(usa.values.gdp.value).toBeNull();
    expect(china.values.population.provenance).toMatchObject({
      snapshot: snapshot("population"),
      sourceRow: 1,
      measureId: "population",
      concordanceRevision: "concordance-1",
      mappingRevisions: ["mapping-1"],
    });
    expect(china.values.gdp.provenance).toMatchObject({
      snapshot: snapshot("gdp"),
      sourceRow: 1,
      measureId: "gdp",
      concordanceRevision: "concordance-1",
      mappingRevisions: ["mapping-1"],
    });
    expect(result.snapshots).toEqual([snapshot("population"), snapshot("gdp")]);
    expect(population.observations).toHaveLength(3);
    expect(gdp.observations).toHaveLength(3);
  });

  it("is coordinate-order independent and emits deterministically sorted integrated keys", () => {
    const rows = [
      row("840", "2010", "31", "7"),
      row("156", "1960", "11", "8"),
      row("840", "1960", "11", "9"),
    ];
    const a = cube("population", rows);
    const b = cube("gdp", [...rows].reverse(), [...dimensions].reverse());
    const joined = integrateCubes(a, b);
    expect(joined.observations.map((o) => o.cellKey)).toEqual(
      [...joined.observations.map((o) => o.cellKey)].sort(),
    );
    expect(joined.observations).toHaveLength(3);
    for (const observation of joined.observations) {
      expect(observation.values.population.value).toBe(
        observation.values.gdp.value,
      );
      expect(
        observation.values.population.provenance.sourceCoordinate.members[0]
          .dimensionId,
      ).toBe("country");
      expect(
        observation.values.gdp.provenance.sourceCoordinate.members[0]
          .dimensionId,
      ).toBe("industry");
    }
    expect(integrateCubes(b, a).observations.map((o) => o.cellKey)).toEqual(
      joined.observations.map((o) => o.cellKey),
    );
  });

  it("rejects missing measure values and input observations beyond the resource limit", () => {
    const a = cube("population", [row("156", "1960", "11", "1")]);
    const b = cube("gdp", [row("156", "1960", "11", "2")]);
    const malformed = {
      ...b,
      observations: [{ ...b.observations[0], values: {} }],
    };
    expectCode(() => integrateCubes(a, malformed), "INCOMPATIBLE");
    const oversized = {
      ...a,
      observations: Array(UDC_LIMITS.rows + 1).fill(a.observations[0]),
    };
    expectCode(() => integrateCubes(oversized, b), "LIMIT");
  });
});

describe("UDC multi-axis slicing", () => {
  it("slices an integrated cube twice, removes each fixed axis, and retains both measures' source lineage", () => {
    const rows = [
      row("156", "1960", "11", "1"),
      row("156", "1960", "31", "2"),
      row("156", "2010", "11", "3"),
      row("840", "1960", "11", "4"),
    ];
    const joined = integrateCubes(
      cube("population", rows),
      cube(
        "gdp",
        rows.map((r) => ({ ...r, value: String(Number(r.value) * 10) })),
      ),
    );
    const at1960 = sliceCube(joined, canonicalMember("year", "year:1960"));
    expect(at1960.dimensions.map((d) => d.id)).toEqual(["country", "industry"]);
    expect(at1960.observations).toHaveLength(3);
    const china1960 = sliceCube(
      at1960,
      canonicalMember("country", "country:china"),
    );
    expect(china1960.dimensions.map((d) => d.id)).toEqual(["industry"]);
    expect(china1960.observations).toHaveLength(2);
    const byIndustry = new Map(
      china1960.observations.map((o) => [o.coordinate.members[0].id, o]),
    );
    expect(
      byIndustry.get("industry:agriculture")?.values.population.value,
    ).toBe(1);
    expect(byIndustry.get("industry:manufacturing")?.values.gdp.value).toBe(20);
    const agriculture = byIndustry.get("industry:agriculture")!;
    expect(agriculture.values.population.provenance).toMatchObject({
      snapshot: snapshot("population"),
      sourceRow: 1,
    });
    expect(agriculture.values.gdp.provenance).toMatchObject({
      snapshot: snapshot("gdp"),
      sourceRow: 1,
    });
    expect(
      agriculture.values.population.provenance.sourceCoordinate.members,
    ).toHaveLength(3);
    expect(
      agriculture.values.gdp.provenance.sourceCoordinate.members,
    ).toHaveLength(3);
    expect(joined.dimensions).toHaveLength(3);
    expect(joined.observations).toHaveLength(4);
  });

  it("empty slices remain empty across further valid dimensions without losing definitions", () => {
    const original = cube("population", [row("156", "1960", "11", "5")]);
    const empty = sliceCube(original, canonicalMember("year", "year:2010"));
    expect(empty.observations).toEqual([]);
    const further = sliceCube(
      empty,
      canonicalMember("country", "country:china"),
    );
    expect(further.observations).toEqual([]);
    expect(further.dimensions.map((d) => d.id)).toEqual(["industry"]);
    expect(further.measures).toEqual(original.measures);
    expect(further.snapshots).toEqual(original.snapshots);
  });
});
