import type { SemanticSchema } from "./types";
import { assertId, assertBound, UDC_LIMITS, UdcError } from "./limits";
export function validateSemanticSchema(
  schema: SemanticSchema,
  columns?: readonly string[],
): void {
  assertId(schema.id, "schema");
  assertId(schema.revision, "schema revision");
  if (!schema.dimensions.length || !schema.measures.length)
    throw new UdcError("INVALID", "A cube needs dimensions and measures");
  assertBound(
    schema.dimensions.length + schema.measures.length,
    UDC_LIMITS.columns,
    "mapped columns",
  );
  const fields = new Set<string>(),
    dims = new Set<string>(),
    measures = new Set<string>();
  for (const mapping of schema.dimensions) {
    assertId(mapping.field, "field");
    assertId(mapping.dimension.id, "dimension");
    assertId(mapping.codelist.id, "codelist");
    assertId(mapping.codelist.revision, "codelist revision");
    if (!mapping.dimension.name.trim())
      throw new UdcError("INVALID", "Empty dimension name");
    if (dims.has(mapping.dimension.id))
      throw new UdcError("DUPLICATE", "Duplicate dimension");
    dims.add(mapping.dimension.id);
    if (fields.has(mapping.field))
      throw new UdcError("DUPLICATE", "Duplicate field");
    fields.add(mapping.field);
  }
  for (const mapping of schema.measures) {
    assertId(mapping.field, "field");
    assertId(mapping.measure.id, "measure");
    assertId(mapping.measure.unit, "unit");
    if (!mapping.measure.name.trim())
      throw new UdcError("INVALID", "Empty measure name");
    if (!Number.isFinite(mapping.scale) || mapping.scale === 0)
      throw new UdcError("INVALID", "Invalid scale");
    if (measures.has(mapping.measure.id))
      throw new UdcError("DUPLICATE", "Duplicate measure");
    measures.add(mapping.measure.id);
    if (fields.has(mapping.field))
      throw new UdcError("DUPLICATE", "Duplicate field");
    fields.add(mapping.field);
  }
  if (columns) {
    assertBound(columns.length, UDC_LIMITS.columns, "input columns");
    if (new Set(columns).size !== columns.length)
      throw new UdcError("DUPLICATE", "Duplicate input column");
    for (const field of fields)
      if (!columns.includes(field))
        throw new UdcError("INVALID", "Missing mapped column");
  }
}
