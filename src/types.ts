/** Pure, version-pinned semantic observation model. No IO or server imports. */
/** Dataset identity independent of any particular catalog or hosting platform. */
export interface DatasetSnapshot {
  datasetId: string;
  /** Optional immutable revision of the source. */
  revision?: string;
  /** Optional namespaced identity of the origin, not a fetch URL. */
  sourceId?: string;
  /** VizHub-provenance fields retained for existing integrations. */
  vizId?: string;
  commitId?: string;
  sourceKey?: string;
}
export interface Dimension {
  id: string;
  name: string;
}
export interface Codelist {
  id: string;
  revision: string;
}
export interface CodedMemberRef {
  kind: "coded";
  dimensionId: string;
  codelistId: string;
  codelistRevision: string;
  code: string;
}
export interface Member {
  kind: "canonical";
  dimensionId: string;
  id: string;
}
export type MemberRef = CodedMemberRef | Member;
export interface Coordinate<T extends MemberRef> {
  members: readonly T[];
}
export type CellKey = string;
export interface DimensionFieldMapping {
  field: string;
  dimension: Dimension;
  codelist: Codelist;
}
export interface MeasureDefinition {
  id: string;
  name: string;
  unit: string;
}
export interface MeasureFieldMapping {
  field: string;
  measure: MeasureDefinition;
  scale: number;
}
export interface SemanticSchema {
  id: string;
  revision: string;
  dimensions: readonly DimensionFieldMapping[];
  measures: readonly MeasureFieldMapping[];
}
export interface MeasureProvenance {
  snapshot: DatasetSnapshot;
  sourceRow: number; // 1-based data row; header excluded
  sourceCoordinate: Coordinate<CodedMemberRef>;
  schemaId: string;
  schemaRevision: string;
  measureId: string;
  unit: string;
  concordanceRevision?: string;
  mappingRevisions?: readonly string[];
}
export interface MeasureValue {
  value: number | null;
  provenance: MeasureProvenance;
}
export interface Observation<T extends MemberRef> {
  coordinate: Coordinate<T>;
  cellKey: CellKey;
  values: Readonly<Record<string, MeasureValue>>;
}
export interface CubeBase<T extends MemberRef> {
  dimensions: readonly Dimension[];
  measures: readonly MeasureDefinition[];
  observations: readonly Observation<T>[];
  snapshots: readonly DatasetSnapshot[];
  schemaRevisions: readonly string[];
  concordanceRevisions: readonly string[];
}
export interface SourceCube extends CubeBase<CodedMemberRef> {
  stage: "source";
}
export interface CanonicalCube extends CubeBase<Member> {
  stage: "canonical";
}
export type Relationship =
  "exact" | "close" | "broader" | "narrower" | "related";
export interface CodeMapping {
  source: CodedMemberRef;
  target?: CodedMemberRef;
  canonical?: Member;
  relationship: Relationship;
  verified: boolean;
  revision: string;
  provenance: string;
  effectiveFrom?: string; // inclusive ISO date YYYY-MM-DD
  effectiveTo?: string;
}
export type Resolution =
  | { status: "resolved"; member: Member; mappingRevisions: readonly string[] }
  | { status: "unresolved"; reason: string }
  | { status: "conflict"; reason: string };
export interface Concordance {
  revision: string;
  resolve(ref: CodedMemberRef): Resolution;
}
