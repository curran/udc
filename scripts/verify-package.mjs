import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const pkg = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url)),
);
assert.equal(pkg.name, "@vizhub/udc");
assert.equal(pkg.type, "module");
assert.equal(pkg.exports["."].types, "./dist/index.d.ts");
assert.equal(pkg.exports["."].import, "./dist/index.js");
assert.equal(pkg.types, "./dist/index.d.ts");
assert.equal(
  Object.keys(pkg.dependencies ?? {}).length,
  0,
  "UDC must have zero production dependencies",
);

const declarations = readFileSync(
  new URL("../dist/index.d.ts", import.meta.url),
  "utf8",
);
for (const name of [
  "aggregateCube",
  "AggregatedCube",
  "AggregatedObservation",
]) {
  assert.match(
    declarations,
    new RegExp(`\\b${name}\\b`),
    name + " must be declared",
  );
}

const mod = await import(pathToFileURL(resolve("dist/index.js")).href);
for (const name of [
  "createCube",
  "resolveConcordance",
  "canonicalizeCube",
  "integrateCubes",
  "sliceCube",
  "getCellKey",
  "aggregateCube",
]) {
  assert.equal(typeof mod[name], "function", name + " must be exported");
}
assert.equal(typeof mod.parseTabular, "undefined");
const bundle = readFileSync(new URL("../dist/index.js", import.meta.url), "utf8");
assert.doesNotMatch(bundle, /d3-dsv|csvParse|tsvParse/);
console.log("Standalone ESM package smoke test passed.");
