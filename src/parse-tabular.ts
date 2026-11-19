import { csvParse, tsvParse } from "d3-dsv";
import { UDC_LIMITS, UdcError, assertBound } from "./limits";
export type TabularRows = Array<Record<string, string>> & { columns: string[] };
/** Applies limits before and after parsing; never truncates. */
export function parseTabular(text: string, format: "csv" | "tsv"): TabularRows {
  if (format !== "csv" && format !== "tsv")
    throw new UdcError("INVALID", "Unsupported tabular format");
  if (new TextEncoder().encode(text).length > UDC_LIMITS.fileBytes)
    throw new UdcError("LIMIT", "File byte limit exceeded");
  // Bound line count to cap cost of pathological input with enormous empty records.
  if (text.split("\n").length > UDC_LIMITS.rows * 100 + 1)
    throw new UdcError("LIMIT", "Input line limit exceeded");
  const parsed = format === "csv" ? csvParse(text) : tsvParse(text);
  assertBound(parsed.columns.length, UDC_LIMITS.columns, "input columns");
  assertBound(parsed.length, UDC_LIMITS.rows, "input rows");
  if (new Set(parsed.columns).size !== parsed.columns.length)
    throw new UdcError("DUPLICATE", "Duplicate input columns");
  return parsed as TabularRows;
}
