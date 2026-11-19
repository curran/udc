import type { CanonicalCube, Member } from "./types";
import { getCellKey, memberIdentity } from "./coordinate";
import { UdcError } from "./limits";
/** Select a member, remove its dimension, preserve every measure's lineage. */
export function sliceCube(cube: CanonicalCube, member: Member): CanonicalCube {
  if (cube.stage !== "canonical")
    throw new UdcError("INCOMPATIBLE", "Expected canonical cube");
  memberIdentity(member);
  if (!cube.dimensions.some((d) => d.id === member.dimensionId))
    throw new UdcError("INCOMPATIBLE", "Member dimension not in cube");
  const observations = cube.observations.flatMap((obs) => {
    if (
      !obs.coordinate.members.some(
        (m) => m.dimensionId === member.dimensionId && m.id === member.id,
      )
    )
      return [];
    const coordinate = {
      members: obs.coordinate.members.filter(
        (m) => m.dimensionId !== member.dimensionId,
      ),
    };
    return [
      { coordinate, cellKey: getCellKey(coordinate), values: obs.values },
    ];
  });
  return {
    ...cube,
    dimensions: cube.dimensions.filter((x) => x.id !== member.dimensionId),
    observations,
  };
}
