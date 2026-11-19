import { readFileSync } from "node:fs";
import {
  parseTabular,
  createCube,
  resolveConcordance,
  codedRef,
  canonicalMember,
  canonicalizeCube,
  integrateCubes,
  sliceCube,
} from "../dist/index.js";

const read = (file) =>
  parseTabular(
    readFileSync(new URL("../test/fixtures/" + file, import.meta.url), "utf8"),
    "csv",
  );
const population = read("total_population.csv");
const gdp = read("GDP_current_USD.csv");
const locations = read("locations.csv");
const country = { id: "country", name: "Country" };
const year = { id: "year", name: "Year" };
const years = { id: "calendar-year", revision: "2014" };
const dimensions = (countryCodelist) => [
  { field: "countryCode", dimension: country, codelist: countryCodelist },
  { field: "year", dimension: year, codelist: years },
];
const popSchema = {
  id: "un-population",
  revision: "2014",
  dimensions: dimensions({ id: "un-m49", revision: "2014" }),
  measures: [
    {
      field: "population",
      measure: { id: "population", name: "Population", unit: "persons" },
      scale: 1000,
    },
  ],
};
const gdpSchema = {
  id: "world-bank-gdp",
  revision: "2014",
  dimensions: dimensions({ id: "iso-alpha3", revision: "2014" }),
  measures: [
    {
      field: "gdp",
      measure: { id: "gdp-usd", name: "GDP (current US$)", unit: "USD" },
      scale: 1,
    },
  ],
};
const exact = (source, canonical) => ({
  source,
  canonical,
  relationship: "exact",
  verified: true,
  revision: "2014-mapping",
  provenance: "2014 sample concordance, review for real-world reuse",
});
const mappings = locations.flatMap((row) => {
  const id =
    row.countryName === "United States of America"
      ? "country:usa"
      : "country:" + row.countryName.toLowerCase();
  const canonical = canonicalMember("country", id);
  return [
    exact(codedRef("country", "un-m49", "2014", row.unCountryCode), canonical),
    exact(codedRef("country", "iso-alpha3", "2014", row.alphaCode), canonical),
  ];
});
for (const value of new Set([...population, ...gdp].map((row) => row.year))) {
  mappings.push(
    exact(
      codedRef("year", "calendar-year", "2014", value),
      canonicalMember("year", "year:" + value),
    ),
  );
}
const concordance = resolveConcordance(mappings, { revision: "2014-fixture" });
const toCanonical = (rows, schema, id) =>
  canonicalizeCube(
    createCube(rows, schema, { datasetId: id, revision: "2014" }),
    concordance,
  );
const joined = integrateCubes(
  toCanonical(population, popSchema, "un-population"),
  toCanonical(gdp, gdpSchema, "world-bank-gdp"),
);
const sliced = sliceCube(joined, canonicalMember("year", "year:1960"));
console.log(
  sliced.observations.map((row) => ({
    country: row.coordinate.members.find((m) => m.dimensionId === "country")
      ?.id,
    population: row.values.population.value,
    gdp: row.values["gdp-usd"].value,
  })),
);
