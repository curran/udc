import type {
  CodeMapping,
  Concordance,
  CodedMemberRef,
  Member,
  Resolution,
} from "./types";
import { memberIdentity } from "./coordinate";
import { assertId, UdcError } from "./limits";

export interface ConcordanceContext {
  revision: string;
  at?: string;
}
const isoDate = (x: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(x)) return false;
  const timestamp = Date.parse(x + "T00:00:00Z");
  return (
    Number.isFinite(timestamp) &&
    new Date(timestamp).toISOString().slice(0, 10) === x
  );
};
/** Deterministic exact-equivalence closure; unverified/fuzzy edges do not union. */
export function resolveConcordance(
  mappings: readonly CodeMapping[],
  context: ConcordanceContext,
): Concordance {
  assertId(context.revision, "concordance revision");
  if (context.at && !isoDate(context.at))
    throw new UdcError("INVALID", "Invalid effective date");
  const parent = new Map<string, string>();
  const anchor = new Map<string, Member[]>();
  const revisions = new Map<string, Set<string>>();
  const conflicted = new Set<string>();
  const find = (key: string): string => {
    if (!parent.has(key)) parent.set(key, key);
    const p = parent.get(key)!;
    if (p !== key) parent.set(key, find(p));
    return parent.get(key)!;
  };
  const merge = (a: string, b: string) => {
    const x = find(a),
      y = find(b);
    if (x === y) return;
    const first = x < y ? x : y,
      second = x < y ? y : x;
    parent.set(second, first);
    anchor.set(first, [
      ...(anchor.get(first) ?? []),
      ...(anchor.get(second) ?? []),
    ]);
    revisions.set(
      first,
      new Set([
        ...(revisions.get(first) ?? []),
        ...(revisions.get(second) ?? []),
      ]),
    );
    if (conflicted.has(second) || conflicted.has(first)) conflicted.add(first);
  };
  // Stable ordering ensures union and diagnostics are independent of fixture order.
  const sorted = [...mappings].sort((a, b) => {
    const left = JSON.stringify(a),
      right = JSON.stringify(b);
    return left < right ? -1 : left > right ? 1 : 0;
  });
  for (const mapping of sorted) {
    const source = memberIdentity(mapping.source);
    assertId(mapping.revision, "mapping revision");
    if (!mapping.provenance.trim())
      throw new UdcError("INVALID", "Missing mapping provenance");
    if ((mapping.target ? 1 : 0) + (mapping.canonical ? 1 : 0) !== 1)
      throw new UdcError("INVALID", "Mapping must have one target");
    if (
      mapping.target &&
      mapping.target.dimensionId !== mapping.source.dimensionId
    )
      throw new UdcError("INCOMPATIBLE", "Cross-dimension mapping");
    if (
      mapping.canonical &&
      mapping.canonical.dimensionId !== mapping.source.dimensionId
    )
      throw new UdcError(
        "INCOMPATIBLE",
        "Cross-dimension canonical assignment",
      );
    if (mapping.target) memberIdentity(mapping.target);
    if (mapping.canonical) memberIdentity(mapping.canonical);
    if (
      (mapping.effectiveFrom && !isoDate(mapping.effectiveFrom)) ||
      (mapping.effectiveTo && !isoDate(mapping.effectiveTo))
    )
      throw new UdcError("INVALID", "Invalid effective bounds");
    if (
      mapping.effectiveFrom &&
      mapping.effectiveTo &&
      mapping.effectiveFrom > mapping.effectiveTo
    )
      throw new UdcError("INCOMPATIBLE", "Inverted effective bounds");
    if (!mapping.verified || mapping.relationship !== "exact") continue;
    if (mapping.effectiveFrom || mapping.effectiveTo) {
      if (!context.at) {
        conflicted.add(find(source));
        continue;
      }
      if (
        (mapping.effectiveFrom && context.at < mapping.effectiveFrom) ||
        (mapping.effectiveTo && context.at > mapping.effectiveTo)
      )
        continue;
    }
    find(source);
    if (mapping.target) merge(source, memberIdentity(mapping.target));
    const root = find(source);
    if (mapping.canonical)
      anchor.set(root, [...(anchor.get(root) ?? []), mapping.canonical]);
    revisions.set(
      root,
      new Set([...(revisions.get(root) ?? []), mapping.revision]),
    );
  }
  // Build a snapshot of all roots. Never let path compression mutate resolution results.
  const resolutions = new Map<string, Resolution>();
  for (const key of parent.keys()) {
    const root = find(key);
    const ids = new Map(
      (anchor.get(root) ?? []).map((m) => [memberIdentity(m), m]),
    );
    const resolution: Resolution = conflicted.has(root)
      ? { status: "conflict", reason: "Ambiguous mapping scope" }
      : ids.size > 1
        ? { status: "conflict", reason: "Conflicting canonical assignments" }
        : ids.size === 0
          ? { status: "unresolved", reason: "No canonical member assignment" }
          : {
              status: "resolved",
              member: [...ids.values()][0],
              mappingRevisions: [...(revisions.get(root) ?? [])].sort(),
            };
    resolutions.set(key, resolution);
  }
  return {
    revision: context.revision,
    resolve(ref: CodedMemberRef): Resolution {
      return (
        resolutions.get(memberIdentity(ref)) ?? {
          status: "unresolved",
          reason: "No verified exact mapping",
        }
      );
    },
  };
}
