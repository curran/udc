import { describe, expect, it } from "vitest";
import { createCube, parseTabular, type DatasetSnapshot, type SemanticSchema } from "../src/index";

describe("provider-neutral package usage", () => {
  const schema: SemanticSchema = {
    id: "schema:rainfall",
    revision: "v1",
    dimensions: [
      {
        field: "station",
        dimension: { id: "station", name: "Weather station" },
        codelist: { id: "stations", revision: "v1" },
      },
    ],
    measures: [
      {
        field: "amount",
        measure: {
          id: "rainfall",
          name: "Rainfall",
          unit: "mm",
          aggregation: "sum",
        },
        scale: 1,
      },
    ],
  };

  it("constructs a cube without VizHub visualization IDs", () => {
    const snapshot: DatasetSnapshot = {
      datasetId: "rainfall-2026",
      revision: "version-1",
      sourceId: "weather-catalog",
    };
    const rows = parseTabular("station,amount\nA,12.5\n", "csv");
    const cube = createCube(rows, schema, snapshot);
    expect(cube.observations[0].values.rainfall.value).toBe(12.5);
    expect(cube.observations[0].values.rainfall.provenance.snapshot).toEqual(
      snapshot,
    );
  });

  it("rejects empty or invalid required snapshot identity", () => {
    const rows = parseTabular("station,amount\nA,12.5\n", "csv");
    expect(() => createCube(rows, schema, { datasetId: "" })).toThrow();
    expect(() =>
      createCube(rows, schema, {
        datasetId: "rainfall",
        revision: "bad revision!",
      }),
    ).toThrow();
  });
});
