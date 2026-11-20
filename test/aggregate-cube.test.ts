import { describe, expect, it } from "vitest";
import {
  aggregateCube,
  canonicalMember,
  codedRef,
  getCellKey,
  UdcError,
  type CanonicalCube,
  type MeasureDefinition,
  type MeasureProvenance,
  type Observation,
  type Member,
} from "../src/index";

const dimensions = [
  { id: "country", name: "Country" },
  { id: "year", name: "Year" },
];
const measures: MeasureDefinition[] = [
  { id: "revenue", name: "Revenue", unit: "USD", aggregation: "sum" },
  {
    id: "temperature",
    name: "Temperature",
    unit: "celsius",
    aggregation: "average",
  },
  { id: "flag", name: "Flag", unit: "dimensionless", aggregation: "count" },
];
const snapshot = { datasetId: "fixture" };
function row(
  country: string,
  year: string,
  index: number,
  revenue: number | null,
  temperature: number | null,
  flag: number | null,
): Observation<Member> {
  const coordinate = {
    members: [
      canonicalMember("country", "country:" + country),
      canonicalMember("year", "year:" + year),
    ],
  };
  const provenance = (measureId: string): MeasureProvenance => ({
    snapshot,
    sourceRow: index,
    sourceCoordinate: {
      members: [
        codedRef("country", "iso", "1", country),
        codedRef("year", "calendar", "1", year),
      ],
    },
    schemaId: "schema",
    schemaRevision: "v1",
    measureId,
    unit: measureId === "revenue" ? "USD" : "dimensionless",
  });
  return {
    coordinate,
    cellKey: getCellKey(coordinate),
    values: {
      revenue: { value: revenue, provenance: provenance("revenue") },
      temperature: {
        value: temperature,
        provenance: provenance("temperature"),
      },
      flag: { value: flag, provenance: provenance("flag") },
    },
  };
}
const source: CanonicalCube = {
  stage: "canonical",
  dimensions,
  measures,
  observations: [
    row("us", "2023", 1, 10, 10, 1),
    row("us", "2024", 2, 30, 30, null),
    row("eu", "2023", 3, 50, 50, null),
    row("ca", "2023", 4, null, null, null),
  ],
  snapshots: [snapshot],
  schemaRevisions: ["v1"],
  concordanceRevisions: ["c1"],
};

describe("explicit cube aggregation", () => {
  it("sums, counts, averages and retains all original source-row lineage", () => {
    const result = aggregateCube(source, []);
    expect(result.stage).toBe("aggregated");
    expect(result.observations).toHaveLength(1);
    const values = result.observations[0].values;
    expect(values.revenue.value).toBe(90);
    expect(values.temperature.value).toBe(30);
    expect(values["flag:count"].value).toBe(1);
    expect(values.revenue.contributors).toHaveLength(4);
    expect(values.revenue.contributors.map((p) => p.sourceRow)).toEqual([
      4, 3, 1, 2,
    ]);
    expect(result.measures.find((m) => m.id === "flag:count")).toMatchObject({
      unit: "observations",
      aggregation: "sum",
    });
    expect(result.snapshots).toEqual([snapshot]);
  });

  it("preserves sufficient statistics across repeated rollups", () => {
    const byCountry = aggregateCube(source, ["country"]);
    expect(byCountry.observations).toHaveLength(3);
    const empty = byCountry.observations.find((o) =>
      o.coordinate.members.some((m) => m.id === "country:ca"),
    );
    expect(empty!.values.revenue.value).toBeNull();
    expect(empty!.values["flag:count"].value).toBe(0);
    const rolled = aggregateCube(byCountry, []);
    const direct = aggregateCube(source, []);
    expect(rolled.observations[0].values.temperature.value).toBe(
      direct.observations[0].values.temperature.value,
    );
    expect(rolled.observations[0].values.revenue.value).toBe(90);
    expect(rolled.observations[0].values["flag:count"].value).toBe(1);
    expect(rolled.observations[0].values.temperature.state).toEqual({
      sum: 90,
      count: 3,
    });
  });

  it("does not infer a policy for non-additive measures", () => {
    const incompatible: CanonicalCube = {
      ...source,
      measures: source.measures.map((measure) =>
        measure.id === "temperature"
          ? { ...measure, aggregation: "none" }
          : measure,
      ),
    };
    expect(() => aggregateCube(incompatible, ["country"])).toThrow(UdcError);
    expect(
      aggregateCube(incompatible, ["country", "year"]).observations,
    ).toHaveLength(4);
  });

  it("rejects undeclared dimensions and duplicate coordinates", () => {
    expect(() => aggregateCube(source, ["unknown"])).toThrow(UdcError);
    expect(() => aggregateCube(source, ["country", "country"])).toThrow(
      UdcError,
    );
    const duplicate: CanonicalCube = {
      ...source,
      observations: [...source.observations, source.observations[0]],
    };
    expect(() => aggregateCube(duplicate, [])).toThrow(UdcError);
  });
});
