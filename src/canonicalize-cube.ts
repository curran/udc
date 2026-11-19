import type { SourceCube, CanonicalCube } from "./types";
import type { Concordance } from "./types";
import { getCellKey } from "./coordinate";
import { assertBound, UDC_LIMITS, UdcError } from "./limits";
/** Strict translation; coordinate collisions are not implicit aggregation. */
export function canonicalizeCube(
  source: SourceCube,
  concordance: Concordance,
): CanonicalCube {
  if (source.stage !== "source")
    throw new UdcError("INCOMPATIBLE", "Expected SourceCube");
  const seen = new Set<string>();
  const observations = source.observations.map((observation) => {
    const mappingRevisions = new Set<string>();
    const members = observation.coordinate.members.map((ref) => {
      const result = concordance.resolve(ref);
      if (result.status !== "resolved")
        throw new UdcError(
          result.status === "conflict" ? "CONFLICT" : "UNRESOLVED",
          "Cannot canonicalize coordinate",
        );
      for (const revision of result.mappingRevisions)
        mappingRevisions.add(revision);
      if (result.member.dimensionId !== ref.dimensionId)
        throw new UdcError("INCOMPATIBLE", "Wrong canonical dimension");
      return result.member;
    });
    const coordinate = { members },
      cellKey = getCellKey(coordinate);
    if (seen.has(cellKey))
      throw new UdcError("CONFLICT", "Canonical coordinate collision");
    seen.add(cellKey);
    const values = Object.fromEntries(
      Object.entries(observation.values).map(([id, v]) => [
        id,
        {
          value: v.value,
          provenance: {
            ...v.provenance,
            concordanceRevision: concordance.revision,
            mappingRevisions: [...mappingRevisions].sort(),
          },
        },
      ]),
    );
    return { coordinate, cellKey, values };
  });
  assertBound(
    observations.length,
    UDC_LIMITS.outputObservations,
    "canonical observations",
  );
  return {
    ...source,
    stage: "canonical",
    observations,
    concordanceRevisions: [concordance.revision],
  };
}
