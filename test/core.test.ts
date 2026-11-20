import { describe, expect, it } from "vitest";
import {
  getCellKey,
  codedRef,
  canonicalMember,
  createCube,
  validateSemanticSchema,
  parseTabular,
  resolveConcordance,
  canonicalizeCube,
  integrateCubes,
  sliceCube,
  UdcError,
  type CanonicalCube,
  type CodeMapping,
  type SemanticSchema,
  type DatasetSnapshot,
} from "../src/index";

const country = { id: "country", name: "Country" },
  year = { id: "year", name: "Year" };
const ref = (code: string, version = "1") =>
  codedRef("country", "m49", version, code);
const chn = canonicalMember("country", "country:china");
const yr = canonicalMember("year", "year:1960");
const snapshot: DatasetSnapshot = {
  datasetId: "ds_c_" + "a".repeat(64),
  vizId: "viz1",
  commitId: "c1",
  sourceKey: "s1",
};
const schema: SemanticSchema = {
  id: "population",
  revision: "1",
  dimensions: [
    {
      field: "code",
      dimension: country,
      codelist: { id: "m49", revision: "1" },
    },
  ],
  measures: [
    {
      field: "n",
      measure: {
        id: "population",
        name: "Population",
        unit: "persons",
        aggregation: "sum",
      },
      scale: 1000,
    },
  ],
};
const map = (
  source: ReturnType<typeof ref>,
  canonical = chn,
  overrides: Partial<CodeMapping> = {},
): CodeMapping => ({
  source,
  canonical,
  relationship: "exact",
  verified: true,
  revision: "r1",
  provenance: "fixture",
  ...overrides,
});
const cube = (rows: Record<string, string>[] = [{ code: "156", n: "2" }]) =>
  createCube(rows, schema, snapshot);
const canon = (rows?: Record<string, string>[]) =>
  canonicalizeCube(
    cube(rows),
    resolveConcordance([map(ref("156"))], { revision: "c1" }),
  );
const fail = (fn: () => unknown, code: UdcError["code"]) => {
  try {
    fn();
    throw new Error("Expected failure");
  } catch (e) {
    if (e instanceof UdcError) expect(e.code).toBe(code);
    else throw e;
  }
};
describe("coordinates", () => {
  it("is stable and permutation invariant while preserving dimension identity", () => {
    const x = {
      members: [ref("156"), codedRef("year", "calendar", "1", "1960")],
    };
    expect(getCellKey(x)).toBe(
      getCellKey({ members: [...x.members].reverse() }),
    );
    expect(getCellKey(x)).toMatch(/^udc-cell-v1:/);
    expect(getCellKey(x)).not.toBe(getCellKey({ members: [ref("156")] }));
    expect(getCellKey({ members: [ref("156")] })).not.toBe(
      getCellKey({ members: [codedRef("year", "m49", "1", "156")] }),
    );
    expect(getCellKey({ members: [ref("156")] })).not.toBe(
      getCellKey({ members: [chn] }),
    );
  });
  it("rejects duplicate dimensions, illegal IDs and codes", () => {
    fail(() => getCellKey({ members: [ref("156"), ref("840")] }), "DUPLICATE");
    fail(() => canonicalMember("bad space", "id"), "INVALID");
    fail(() => ref(""), "INVALID");
  });
});
describe("construct typed source observations", () => {
  it("accepts each declared aggregation policy", () => {
    for (const op of ["sum", "count", "average", "none"] as const) {
      const changed = {
        ...schema,
        measures: [
          {
            ...schema.measures[0],
            measure: { ...schema.measures[0].measure, aggregation: op },
          },
        ],
      };
      expect(() => validateSemanticSchema(changed)).not.toThrow();
    }
  });
  it("rejects missing or unsupported aggregation policies", () => {
    for (const bad of [undefined, "median", null]) {
      const changed = {
        ...schema,
        measures: [
          {
            ...schema.measures[0],
            measure: { ...schema.measures[0].measure, aggregation: bad },
          },
        ],
      };
      fail(
        () => validateSemanticSchema(changed as unknown as SemanticSchema),
        "INVALID",
      );
    }
  });
  it("preserves zero, negative, missing and scaled values", () => {
    expect(
      cube([{ code: "156", n: "0" }]).observations[0].values.population.value,
    ).toBe(0);
    expect(
      cube([{ code: "156", n: "-2" }]).observations[0].values.population.value,
    ).toBe(-2000);
    expect(
      cube([{ code: "156", n: "" }]).observations[0].values.population.value,
    ).toBe(null);
    expect(cube().observations[0].values.population.provenance.sourceRow).toBe(
      1,
    );
  });
  it("rejects invalid, nonfinite and duplicate observations", () => {
    fail(() => cube([{ code: "156", n: "Infinity" }]), "INVALID");
    fail(() => cube([{ code: "156", n: "1e400" }]), "INVALID");
    fail(
      () =>
        cube([
          { code: "156", n: "1" },
          { code: "156", n: "2" },
        ]),
      "DUPLICATE",
    );
    fail(() => cube([{ code: "156", bad: "2" }]), "INVALID");
    fail(() => cube([{ code: "156", n: "2" }, { code: "840" }]), "INVALID");
    fail(
      () =>
        cube([
          {
            code: "156",
            n: "2",
            ...Object.fromEntries(
              Array.from({ length: 101 }, (_, j) => ["extra" + j, "x"]),
            ),
          },
        ]),
      "LIMIT",
    );
  });
  it("validates duplicate and missing schema fields", () => {
    fail(
      () =>
        createCube(
          [{ code: "156", n: "2" }],
          {
            ...schema,
            dimensions: [...schema.dimensions, ...schema.dimensions],
          },
          snapshot,
        ),
      "DUPLICATE",
    );
    fail(
      () =>
        createCube(
          [{ code: "156", n: "2" }],
          { ...schema, measures: [...schema.measures, ...schema.measures] },
          snapshot,
        ),
      "DUPLICATE",
    );
    fail(
      () =>
        createCube(
          [{ code: "156", n: "2" }],
          { ...schema, measures: [{ ...schema.measures[0], scale: 0 }] },
          snapshot,
        ),
      "INVALID",
    );
  });
  it("parses CSV/TSV, quoted fields and multiline values", () => {
    expect(parseTabular('a,b\n"x,y","two\nlines"\n', "csv")[0]).toEqual({
      a: "x,y",
      b: "two\nlines",
    });
    expect(parseTabular("a\tb\nx\ty\n", "tsv")[0]).toEqual({ a: "x", b: "y" });
    fail(() => parseTabular("a,b\n" + "x,y\n".repeat(10_001), "csv"), "LIMIT");
  });
});
describe("explicit concordance semantics", () => {
  it("resolves transitively, independent of mapping order", () => {
    const bridge = codedRef("country", "iso", "1", "CHN");
    const edges: CodeMapping[] = [
      map(ref("156"), chn),
      {
        source: ref("156"),
        target: bridge,
        relationship: "exact",
        verified: true,
        revision: "r2",
        provenance: "fixture",
      },
    ];
    const left = resolveConcordance(edges, { revision: "c1" });
    const right = resolveConcordance([...edges].reverse(), { revision: "c1" });
    expect(left.resolve(bridge)).toEqual(right.resolve(bridge));
    expect(left.resolve(bridge)).toMatchObject({
      status: "resolved",
      member: chn,
    });
  });
  it("refuses unverified, close, broader and narrower mappings", () => {
    for (const relationship of [
      "close",
      "broader",
      "narrower",
      "related",
    ] as const)
      expect(
        resolveConcordance([map(ref("156"), chn, { relationship })], {
          revision: "c1",
        }).resolve(ref("156")).status,
      ).toBe("unresolved");
    expect(
      resolveConcordance([map(ref("156"), chn, { verified: false })], {
        revision: "c1",
      }).resolve(ref("156")).status,
    ).toBe("unresolved");
  });
  it("detects contradictory canonical assignments and cross-dimension mappings", () => {
    const mappings = [
      map(ref("156"), chn),
      map(ref("156"), canonicalMember("country", "country:other")),
    ];
    expect(
      resolveConcordance(mappings, { revision: "c1" }).resolve(ref("156"))
        .status,
    ).toBe("conflict");
    fail(
      () =>
        resolveConcordance(
          [map(ref("156"), canonicalMember("year", "year:1960"))],
          { revision: "c1" },
        ),
      "INCOMPATIBLE",
    );
  });
  it("honors effective-date scope, isolation of codelist revisions and mapping revisions", () => {
    const dated = map(ref("156"), chn, {
      effectiveFrom: "1960-01-01",
      effectiveTo: "1970-01-01",
    });
    expect(
      resolveConcordance([dated], { revision: "v2" }).resolve(ref("156"))
        .status,
    ).toBe("conflict");
    expect(
      resolveConcordance([dated], { revision: "v2", at: "1980-01-01" }).resolve(
        ref("156"),
      ).status,
    ).toBe("unresolved");
    fail(
      () => resolveConcordance([dated], { revision: "v2", at: "1960-02-30" }),
      "INVALID",
    );
    expect(
      resolveConcordance([dated], { revision: "v2", at: "1960-01-01" }).resolve(
        ref("156"),
      ),
    ).toMatchObject({ status: "resolved", mappingRevisions: ["r1"] });
    expect(
      resolveConcordance([map(ref("156"))], { revision: "v1" }).resolve(
        ref("156", "2"),
      ).status,
    ).toBe("unresolved");
  });
});
describe("canonicalization, integration and slices", () => {
  it("preserves original source codes and detects collapsed coordinate collisions", () => {
    const source = cube([
      { code: "156", n: "2" },
      { code: "840", n: "3" },
    ]);
    const mappings = [map(ref("156")), map(ref("840"))];
    fail(
      () =>
        canonicalizeCube(
          source,
          resolveConcordance(mappings, { revision: "c1" }),
        ),
      "CONFLICT",
    );
    const output = canon();
    expect(output.stage).toBe("canonical");
    expect(
      output.observations[0].values.population.provenance.sourceCoordinate
        .members[0].code,
    ).toBe("156");
    expect(output.concordanceRevisions).toEqual(["c1"]);
  });
  it("strictly joins coordinates; never overwrites duplicate measures", () => {
    const a = canon(),
      b = canon();
    fail(() => integrateCubes(a, b), "CONFLICT");
    const different: CanonicalCube = {
      ...b,
      measures: [{ id: "gdp", name: "GDP", unit: "USD", aggregation: "sum" }],
      observations: b.observations.map((x) => ({
        ...x,
        values: {
          gdp: {
            ...x.values.population,
            provenance: {
              ...x.values.population.provenance,
              measureId: "gdp",
              unit: "USD",
            },
          },
        },
      })),
    };
    expect(integrateCubes(a, different).observations[0].values.gdp.value).toBe(
      2000,
    );
    expect(
      integrateCubes(a, { ...different, observations: [] }).observations,
    ).toEqual([]);
    fail(
      () => integrateCubes(a, { ...different, dimensions: [year] }),
      "INCOMPATIBLE",
    );
    fail(
      () =>
        integrateCubes(a, {
          ...different,
          observations: [...different.observations, ...different.observations],
        }),
      "DUPLICATE",
    );
    fail(
      () =>
        integrateCubes(a, {
          ...different,
          observations: [{ ...different.observations[0], cellKey: "bad" }],
        }),
      "DUPLICATE",
    );
  });
  it("slice removes dimension without discarding provenance", () => {
    const source = canon(),
      sliced = sliceCube(source, chn);
    expect(sliced.dimensions).toEqual([]);
    expect(sliced.observations[0].coordinate.members).toEqual([]);
    expect(sliced.observations[0].values.population.provenance.snapshot).toBe(
      snapshot,
    );
    expect(
      sliceCube(source, canonicalMember("country", "country:usa")).observations,
    ).toEqual([]);
    fail(() => sliceCube(source, yr), "INCOMPATIBLE");
  });
});
