import type {
  AggregatedCube,
  AggregatedMeasureValue,
  AggregatedObservation,
  CanonicalCube,
  Coordinate,
  MeasureDefinition,
  MeasureProvenance,
  MeasureValue,
  Member,
} from "./types";
import { getCellKey } from "./coordinate";
import { assertBound, assertId, UDC_LIMITS, UdcError } from "./limits";

type InputCube = CanonicalCube | AggregatedCube;
interface MutableValue {
  sum: number;
  count: number;
  contributors: MeasureProvenance[];
}
interface MutableGroup {
  coordinate: Coordinate<Member>;
  cellKey: string;
  rows: number;
  values: Map<string, MutableValue>;
}

const stable = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

/**
 * Explicitly reduce canonical coordinates to a subset of dimensions.
 *
 * No hierarchy inference, unit conversion or implicit merging. Returns a
 * separate stage with all source-row lineage and sufficient statistics so
 * repeated averages are never computed as averages of averages.
 */
export function aggregateCube(
  cube: InputCube,
  retainDimensionIds: readonly string[],
): AggregatedCube {
  if (!cube || (cube.stage !== "canonical" && cube.stage !== "aggregated"))
    throw new UdcError("INCOMPATIBLE", "Expected canonical or aggregated cube");
  if (!Array.isArray(retainDimensionIds))
    throw new UdcError("INVALID", "Invalid retained dimensions");
  assertBound(cube.observations.length, UDC_LIMITS.rows, "input observations");
  assertBound(cube.measures.length, UDC_LIMITS.columns, "input measures");

  const declared = new Set<string>();
  for (const dimension of cube.dimensions) {
    assertId(dimension.id, "dimension");
    if (declared.has(dimension.id))
      throw new UdcError("DUPLICATE", "Duplicate cube dimension");
    declared.add(dimension.id);
  }
  const retained = new Set<string>();
  for (const id of retainDimensionIds) {
    assertId(id, "retained dimension");
    if (!declared.has(id))
      throw new UdcError("INCOMPATIBLE", "Unknown retained dimension");
    if (retained.has(id))
      throw new UdcError("DUPLICATE", "Duplicate retained dimension");
    retained.add(id);
  }

  const original = new Set<string>();
  const output = new Set<string>();
  const outputMeasures: MeasureDefinition[] = cube.measures.map((measure) => {
    assertId(measure.id, "measure");
    assertId(measure.unit, "measure unit");
    if (!["sum", "count", "average", "none"].includes(measure.aggregation))
      throw new UdcError("INVALID", "Invalid aggregation operator");
    if (original.has(measure.id))
      throw new UdcError("DUPLICATE", "Duplicate measure identity");
    original.add(measure.id);
    const derived: MeasureDefinition =
      measure.aggregation === "count"
        ? {
            id: measure.id + ":count",
            name: measure.name + " (count)",
            unit: "observations",
            aggregation: "sum",
          }
        : measure;
    assertId(derived.id, "derived measure");
    if (output.has(derived.id))
      throw new UdcError("CONFLICT", "Derived measure ID collision");
    output.add(derived.id);
    return derived;
  });

  const groups = new Map<string, MutableGroup>();
  const seen = new Set<string>();
  const ordered = [...cube.observations].sort((a, b) =>
    stable(a.cellKey, b.cellKey),
  );
  for (const observation of ordered) {
    if (getCellKey(observation.coordinate) !== observation.cellKey)
      throw new UdcError("INVALID", "Invalid input coordinate key");
    if (seen.has(observation.cellKey))
      throw new UdcError("DUPLICATE", "Duplicate input coordinate");
    seen.add(observation.cellKey);
    const axes = observation.coordinate.members.map((member) => member.dimensionId);
    if (
      axes.length !== declared.size ||
      axes.some((id) => !declared.has(id))
    )
      throw new UdcError("INCOMPATIBLE", "Input coordinate grain mismatch");
    if (
      Object.keys(observation.values).length !== original.size ||
      Object.keys(observation.values).some((id) => !original.has(id))
    )
      throw new UdcError("INCOMPATIBLE", "Input measure set mismatch");

    const coordinate: Coordinate<Member> = {
      members: observation.coordinate.members.filter((member) =>
        retained.has(member.dimensionId),
      ),
    };
    const cellKey = getCellKey(coordinate);
    let group = groups.get(cellKey);
    if (!group) {
      group = { coordinate, cellKey, rows: 0, values: new Map() };
      for (const measure of cube.measures) {
        group.values.set(measure.id, { sum: 0, count: 0, contributors: [] });
      }
      groups.set(cellKey, group);
    }
    group.rows++;
    for (const measure of cube.measures) {
      const input = observation.values[measure.id];
      if (!input) throw new UdcError("INCOMPATIBLE", "Missing measure value");
      const accumulator = group.values.get(measure.id)!;
      let sum: number;
      let count: number;
      let sources: readonly MeasureProvenance[];
      if (cube.stage === "aggregated") {
        const aggregate = input as AggregatedMeasureValue;
        if (!aggregate.state || !Array.isArray(aggregate.contributors))
          throw new UdcError("INVALID", "Invalid aggregate state");
        sum = aggregate.state.sum;
        count = aggregate.state.count;
        sources = aggregate.contributors;
      } else {
        const atomic = input as MeasureValue;
        if (atomic.value !== null && !Number.isFinite(atomic.value))
          throw new UdcError("INVALID", "Non-finite measure value");
        sum = atomic.value ?? 0;
        count = atomic.value === null ? 0 : 1;
        if (!atomic.provenance)
          throw new UdcError("INVALID", "Missing measure provenance");
        sources = [atomic.provenance];
      }
      if (
        !Number.isFinite(sum) ||
        !Number.isSafeInteger(count) ||
        count < 0
      )
        throw new UdcError("INVALID", "Invalid aggregate accumulator");
      accumulator.sum += sum;
      accumulator.count += count;
      if (!Number.isFinite(accumulator.sum) ||
          !Number.isSafeInteger(accumulator.count))
        throw new UdcError("LIMIT", "Aggregate accumulator overflow");
      accumulator.contributors.push(...sources);
      assertBound(
        accumulator.contributors.length,
        UDC_LIMITS.rows,
        "aggregate lineage",
      );
    }
  }

  const observations: AggregatedObservation[] = [];
  for (const group of groups.values()) {
    const values: Record<string, AggregatedMeasureValue> = {};
    for (let index = 0; index < cube.measures.length; index++) {
      const measure = cube.measures[index];
      const derived = outputMeasures[index];
      const accumulator = group.values.get(measure.id)!;
      if (measure.aggregation === "none" && group.rows > 1)
        throw new UdcError("INCOMPATIBLE", "Non-additive measure cannot roll up");
      const value =
        measure.aggregation === "count"
          ? accumulator.count
          : accumulator.count === 0
            ? null
            : measure.aggregation === "average"
              ? accumulator.sum / accumulator.count
              : accumulator.sum;
      if (value !== null && !Number.isFinite(value))
        throw new UdcError("LIMIT", "Aggregate value overflow");
      values[derived.id] = {
        value,
        state:
          measure.aggregation === "count"
            ? { sum: accumulator.count, count: 1 }
            : { sum: accumulator.sum, count: accumulator.count },
        contributors: accumulator.contributors,
      };
    }
    observations.push({
      coordinate: group.coordinate,
      cellKey: group.cellKey,
      values,
    });
  }
  assertBound(
    observations.length,
    UDC_LIMITS.outputObservations,
    "aggregated observations",
  );
  observations.sort((a, b) => stable(a.cellKey, b.cellKey));
  return {
    stage: "aggregated",
    dimensions: cube.dimensions.filter((dimension) => retained.has(dimension.id)),
    measures: outputMeasures,
    observations,
    snapshots: cube.snapshots,
    schemaRevisions: cube.schemaRevisions,
    concordanceRevisions: cube.concordanceRevisions,
  };
}
