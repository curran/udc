import type { CanonicalCube, Dimension, Observation, Member } from "./types";
import { getCellKey } from "./coordinate";
import { assertBound, assertId, UdcError, UDC_LIMITS } from "./limits";
export interface IntegrationOptions {
  join: "inner";
}
const stable = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
function validate(cube: CanonicalCube): Map<string, Observation<Member>> {
  if (cube.stage !== "canonical")
    throw new UdcError("INCOMPATIBLE", "Both cubes must be canonical");
  assertBound(cube.observations.length, UDC_LIMITS.rows, "input observations");
  const out = new Map<string, Observation<Member>>();
  const declaredDimensions = cube.dimensions.map((d) => d.id).sort(stable);
  const declaredMeasures = cube.measures
    .map((m) => {
      assertId(m.id, "measure");
      assertId(m.unit, "measure unit");
      return m.id;
    })
    .sort(stable);
  if (
    new Set(declaredDimensions).size !== declaredDimensions.length ||
    new Set(declaredMeasures).size !== declaredMeasures.length
  )
    throw new UdcError("DUPLICATE", "Duplicate cube declarations");
  for (const obs of cube.observations) {
    if (getCellKey(obs.coordinate) !== obs.cellKey || out.has(obs.cellKey))
      throw new UdcError(
        "DUPLICATE",
        "Invalid or duplicate canonical coordinate",
      );
    const actualDimensions = obs.coordinate.members
      .map((m) => m.dimensionId)
      .sort(stable);
    if (JSON.stringify(actualDimensions) !== JSON.stringify(declaredDimensions))
      throw new UdcError("INCOMPATIBLE", "Coordinate granularity mismatch");
    if (
      JSON.stringify(Object.keys(obs.values).sort(stable)) !==
      JSON.stringify(declaredMeasures)
    )
      throw new UdcError(
        "INCOMPATIBLE",
        "Measure value set does not match definitions",
      );
    out.set(obs.cellKey, obs);
  }
  return out;
}
/** Strict inner join: same axis set and granularity, no measure overwrites. */
export function integrateCubes(
  a: CanonicalCube,
  b: CanonicalCube,
  options: IntegrationOptions = { join: "inner" },
): CanonicalCube {
  if (options.join !== "inner")
    throw new UdcError("INVALID", "Only inner joins are supported");
  const left = validate(a),
    right = validate(b);
  const dimIds = (dims: readonly Dimension[]) =>
    dims.map((x) => x.id).sort(stable);
  if (
    new Set(dimIds(a.dimensions)).size !== a.dimensions.length ||
    new Set(dimIds(b.dimensions)).size !== b.dimensions.length ||
    JSON.stringify(dimIds(a.dimensions)) !==
      JSON.stringify(dimIds(b.dimensions))
  )
    throw new UdcError(
      "INCOMPATIBLE",
      "Dimensions or granularity incompatible",
    );
  const ids = new Set(a.measures.map((x) => x.id));
  if (
    new Set(ids).size !== a.measures.length ||
    new Set(b.measures.map((x) => x.id)).size !== b.measures.length
  )
    throw new UdcError("DUPLICATE", "Duplicate measure definitions");
  for (const measure of b.measures)
    if (ids.has(measure.id))
      throw new UdcError("CONFLICT", "Duplicate measure identity");
  const observations: Array<Observation<Member>> = [];
  for (const [key, obs] of left) {
    const other = right.get(key);
    if (!other) continue;
    for (const m of a.measures)
      if (!(m.id in obs.values))
        throw new UdcError("INCOMPATIBLE", "Missing left measure");
    for (const m of b.measures)
      if (!(m.id in other.values))
        throw new UdcError("INCOMPATIBLE", "Missing right measure");
    observations.push({
      coordinate: obs.coordinate,
      cellKey: key,
      values: { ...obs.values, ...other.values },
    });
  }
  assertBound(
    observations.length,
    UDC_LIMITS.outputObservations,
    "integrated observations",
  );
  observations.sort((x, y) => stable(x.cellKey, y.cellKey));
  const distinct = <T>(items: readonly T[]) => [...new Set(items)];
  return {
    stage: "canonical",
    dimensions: [...a.dimensions].sort((x, y) => stable(x.id, y.id)),
    measures: [...a.measures, ...b.measures],
    observations,
    snapshots: distinct(
      [...a.snapshots, ...b.snapshots].map((x) => JSON.stringify(x)),
    ).map((x) => JSON.parse(x)),
    schemaRevisions: distinct([
      ...a.schemaRevisions,
      ...b.schemaRevisions,
    ]).sort(stable),
    concordanceRevisions: distinct([
      ...a.concordanceRevisions,
      ...b.concordanceRevisions,
    ]).sort(stable),
  };
}
