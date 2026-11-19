import type {
  DatasetSnapshot,
  SemanticSchema,
  SourceCube,
  MeasureValue,
  CodedMemberRef,
} from "./types";
import { getCellKey, codedRef } from "./coordinate";
import { validateSemanticSchema } from "./semantic-schema";
import { assertBound, assertId, UDC_LIMITS, UdcError } from "./limits";

const NUMERIC = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;
function numeric(input: unknown, scale: number): number | null {
  if (input === "" || input === null || input === undefined) return null;
  if (typeof input !== "string" || !NUMERIC.test(input.trim()))
    throw new UdcError("INVALID", "Invalid numeric value");
  const value = Number(input.trim()) * scale;
  if (!Number.isFinite(value))
    throw new UdcError("INVALID", "Non-finite measure value");
  return value;
}
/** No implicit field meaning, deduplication, or aggregation. */
export function createCube(
  rows: readonly Record<string, string>[],
  schema: SemanticSchema,
  snapshot: DatasetSnapshot,
): SourceCube {
  if (!snapshot || typeof snapshot !== "object")
    throw new UdcError("INVALID", "Missing dataset snapshot");
  assertId(snapshot.datasetId, "dataset snapshot");
  for (const [name, value] of Object.entries(snapshot))
    if (value !== undefined) assertId(value, "snapshot " + name);
  assertBound(rows.length, UDC_LIMITS.rows, "input rows");
  const columns =
    "columns" in rows && Array.isArray(rows.columns)
      ? (rows.columns as string[])
      : Object.keys(rows[0] ?? {});
  validateSemanticSchema(schema, columns);
  const seen = new Set<string>();
  const observations = rows.map((row, index) => {
    if (!row || typeof row !== "object")
      throw new UdcError("INVALID", "Invalid tabular row");
    assertBound(Object.keys(row).length, UDC_LIMITS.columns, "input columns");
    for (const mapping of [...schema.dimensions, ...schema.measures]) {
      if (!Object.prototype.hasOwnProperty.call(row, mapping.field))
        throw new UdcError("INVALID", "Mapped field missing from input row");
    }
    const members: CodedMemberRef[] = schema.dimensions.map(
      ({ field, dimension, codelist }) => {
        const code = row[field];
        if (typeof code !== "string" || !code.trim())
          throw new UdcError("INVALID", "Missing dimension code");
        return codedRef(dimension.id, codelist.id, codelist.revision, code);
      },
    );
    const coordinate = { members };
    const cellKey = getCellKey(coordinate);
    if (seen.has(cellKey))
      throw new UdcError("DUPLICATE", "Duplicate source coordinate");
    seen.add(cellKey);
    const values: Record<string, MeasureValue> = {};
    for (const { field, measure, scale } of schema.measures) {
      values[measure.id] = {
        value: numeric(row[field], scale),
        provenance: {
          snapshot,
          sourceRow: index + 1,
          sourceCoordinate: coordinate,
          schemaId: schema.id,
          schemaRevision: schema.revision,
          measureId: measure.id,
          unit: measure.unit,
        },
      };
    }
    return { coordinate, cellKey, values };
  });
  return {
    stage: "source",
    dimensions: schema.dimensions.map((x) => x.dimension),
    measures: schema.measures.map((x) => x.measure),
    observations,
    snapshots: [snapshot],
    schemaRevisions: [schema.revision],
    concordanceRevisions: [],
  };
}
