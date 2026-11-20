import { describe, expect, it } from "vitest";
import {
  createCube,
  validateSemanticSchema,
  UdcError,
  type AggregationOperator,
  type SemanticSchema,
} from "../src/index";

const operators: readonly AggregationOperator[] = [
  "sum",
  "count",
  "average",
  "none",
];
function schema(aggregation: AggregationOperator): SemanticSchema {
  return {
    id: "schema",
    revision: "v1",
    dimensions: [
      {
        field: "country",
        dimension: { id: "country", name: "Country" },
        codelist: { id: "iso", revision: "1" },
      },
    ],
    measures: [
      {
        field: "value",
        measure: { id: "metric", name: "Metric", unit: "persons", aggregation },
        scale: 1,
      },
    ],
  };
}

describe("aggregation declarations", () => {
  for (const aggregation of operators) {
    it("accepts and retains " + aggregation, () => {
      const definition = schema(aggregation);
      expect(() =>
        validateSemanticSchema(definition, ["country", "value"]),
      ).not.toThrow();
      const cube = createCube(
        [{ country: "US", value: "12" }],
        definition,
        { datasetId: "dataset" },
      );
      expect(cube.measures[0].aggregation).toBe(aggregation);
      expect(cube.measures[0].unit).toBe("persons");
    });
  }
  for (const invalid of [undefined, "", "median", null]) {
    it("rejects invalid " + String(invalid), () => {
      const definition = schema("sum");
      (definition.measures[0].measure as { aggregation: unknown }).aggregation = invalid;
      expect(() => validateSemanticSchema(definition)).toThrow(UdcError);
    });
  }
  it("still requires a nonempty unit", () => {
    const definition = schema("average");
    (definition.measures[0].measure as { unit: string }).unit = "";
    expect(() => validateSemanticSchema(definition)).toThrow(UdcError);
  });
});
