import type {
  CellKey,
  Coordinate,
  MemberRef,
  CodedMemberRef,
  Member,
} from "./types";
import { assertId, UdcError } from "./limits";

export function memberIdentity(member: MemberRef): string {
  assertId(member.dimensionId, "dimension");
  if (member.kind === "canonical") {
    assertId(member.id, "member");
    return JSON.stringify(["canonical", member.dimensionId, member.id]);
  }
  assertId(member.codelistId, "codelist");
  assertId(member.codelistRevision, "codelist revision");
  if (
    typeof member.code !== "string" ||
    member.code.length === 0 ||
    member.code.length > 256 ||
    member.code.split("").some((char) => char.charCodeAt(0) < 32)
  ) {
    throw new UdcError("INVALID", "Invalid member code");
  }
  return JSON.stringify([
    "coded",
    member.dimensionId,
    member.codelistId,
    member.codelistRevision,
    member.code,
  ]);
}

/** Portable, versioned coordinate encoding; dimension-order independent. */
export function getCellKey<T extends MemberRef>(
  coordinate: Coordinate<T>,
): CellKey {
  if (!coordinate || !Array.isArray(coordinate.members))
    throw new UdcError("INVALID", "Invalid coordinate");
  const dimensions = new Set<string>();
  const pairs = coordinate.members.map((member) => {
    const identity = memberIdentity(member);
    if (dimensions.has(member.dimensionId))
      throw new UdcError("DUPLICATE", "Duplicate dimension");
    dimensions.add(member.dimensionId);
    return [member.dimensionId, identity];
  });
  pairs.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  return "udc-cell-v1:" + JSON.stringify(pairs);
}
export function codedRef(
  dimensionId: string,
  codelistId: string,
  codelistRevision: string,
  code: string,
): CodedMemberRef {
  const result: CodedMemberRef = {
    kind: "coded",
    dimensionId,
    codelistId,
    codelistRevision,
    code,
  };
  memberIdentity(result);
  return result;
}
export function canonicalMember(dimensionId: string, id: string): Member {
  const result: Member = { kind: "canonical", dimensionId, id };
  memberIdentity(result);
  return result;
}
