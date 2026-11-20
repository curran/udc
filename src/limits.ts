export const UDC_LIMITS = {
  cubes: 2,
  rows: 10_000,
  columns: 100,
  outputObservations: 10_000,
} as const;
export type UdcErrorCode =
  | "INVALID"
  | "LIMIT"
  | "DUPLICATE"
  | "UNRESOLVED"
  | "CONFLICT"
  | "INCOMPATIBLE";
export class UdcError extends Error {
  constructor(
    readonly code: UdcErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "UdcError";
  }
}
export function assertId(value: string, label = "identifier"): void {
  if (
    typeof value !== "string" ||
    !/^[A-Za-z0-9][A-Za-z0-9:._/-]{0,127}$/.test(value)
  ) {
    throw new UdcError("INVALID", "Invalid " + label);
  }
}
export function assertBound(value: number, max: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 0)
    throw new UdcError("INVALID", "Invalid " + label);
  if (value > max) throw new UdcError("LIMIT", label + " limit exceeded");
}
