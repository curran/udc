// User Guide (and unit tests) for the UDC library.
describe('UDC', function() {
  var UDC;

  // Use require.js to fetch the AMD module.
  it("should load the AMD module", function(done) {
    require(['udc'], function (loadedModule) {
      UDC = loadedModule;
      done();
    });
  });

  // # Overview
  // Tasks:
  //
  //  * load data cube
  //  * load thesauruss into a thesaurus
  //  * query for values
  //  * load hierarchy
  //  * merge hierarchies
  //  * slice
  //  * merge data cubes

  // # User Guide
  //
  // The Universal Data Cube (UDC) library is for modeling data sets
  // as data cubes and integrating them together. The UDC has two kinds of elements:
  //
  //  * "universal elements" are shared by all data sets
  //  * "local elements" are local to each data set
  //
  // By establishing a relationship between local elements and universal elements, the
  // UDC library is able to integrate many data sets together that may:
  //
  //  * refer to the same entities using different identifiers, or
  //  * express the same numeric field using a different scale factor.
  //
  // ## Table
  //
  // In the UDC library, the notion of a "table" is a set of `row` objects
  // (e.g. rows parsed from a CSV file) and some additional metadata that states 
  // how the row objects relate to universal elements.
  var tables = {};

  tables.countryPopulations = {
    //  * `table.rows` an array of `row` objects where
    //    * Keys are column names
    //    * Values are numbers or strings
    "rows": [
      { "Country": "in", "Pop": 1.237 },
      { "Country": "cn", "Pop": 1.351 },
      { "Country": "us", "Pop": 0.3139 }
    ],
    //  * `table.dimensionColumns` an array of `dimensionColumn` objects that 
    //    describe how columns in the table relate to dimensions.
    //    * `column` the column name (key in `row` objects)
    //    * `dimension` the name of the dimension
    //    * `codeList` the name of the code list used by `row` objects.
    //      For each `row` in `table.rows`, `row[column]` yields a string 
    //      that is a code from this code list.
    "dimensionColumns": [
      {
        "column": "Country",
        "dimension": "Space",
        "codeList": "countryCode"
      }
    ],
    //  * `table.measureColumns` an array of `measureColumn` objects that 
    //    describe how columns in the table relate to measures.
    //    * `column` the column name (key in `row` objects)
    //    * `measure` the name of the measure
    //    * `scale` the scale factor used by values.
    //      For each `row` in `table.rows`, `row[column]` yields a number `x` 
    //      such that <br> `x * scale` yields the measure value.
    "measureColumns": [
      {
        "column": "Pop",
        "measure": "Population",
        "scale": 1000000000
      }
    ]
  };
  // Tables are used as input for creating cubes and thesauruss.
  tables.countryGDP = {
    "rows": [
      { "name": "China", "gdp": 12261 },
      { "name": "India", "gdp": 4716 },
      { "name": "United States of America", "gdp": 16244 }
    ],
    "dimensionColumns": [
      {
        "column": "name",
        "dimension": "Space",
        "codeList": "countryName"
      }
    ],
    "measureColumns": [
      {
        "column": "gdp",
        "measure": "Gross Domestic Product",
        "scale": 1000
      }
    ]
  };

  // ## Cube
  // Data cubes are referred to as "cubes". A cube is a data set
  // that comes from a table that includes columns for dimensions
  // and measures.
  //
  //  * dimensions are sets of discrete entities
  //  * measures are aggregated numeric properties
  //
  // One example of cube is a data set that contains values for
  // population (number of people) in each of the three largest
  // countries of the world - China (ch), India (in) and the USA (us).
  it('can load a data cube', function() {
    var table = tables.countryPopulations,

        // `UDC.Cube(table)` is the constructor function for cubes.
        cube = UDC.Cube(table),

        index = UDC.CubeIndex(cube.observations),

        // `cube.values(cell)` queries the cube for values.
        cell = UDC.Cell([UDC.Member('Space', 'countryCode', 'in')]),
        measure = 'Population',
        value = index.values(cell)[measure];

    expect(value).toBe(1.237 * 1000000000);
  });

  // ## Thesaurus
  // Thesaurus tables are tables that provide equivalence mappings
  // between codes from different code lists. A collection of thesaurus
  // tables can be assembled into an equivalence index called a thesaurus.
  tables.countryNamesAndCodes = {
    "dimensionColumns": [
      { "dimension": "Space", "codeList": "countryName", "column": "Country" },
      { "dimension": "Space", "codeList": "countryCode", "column": "Code" }
    ],
    "rows": [
      { "Country": "India", "Code": "in" },
      { "Country": "China", "Code": "cn" },
      { "Country": "United States of America", "Code": "us" }
    ]
  };
  tables.unUsLocations = {
    "dimensionColumns": [
      { "dimension": "Space", "codeList": "countryName", "column": "unName" },
      { "dimension": "Space", "codeList": "countryCode", "column": "usName" }
    ],
    "rows": [
      { "unName": "United States of America", "usName": "USA" }
    ]
  };

  it('can load a thesaurus', function() {
    var table = tables.countryNamesAndCodes,

        // `UDC.Thesaurus([tables])` is the thesaurus constructor function.
        thesaurus = UDC.Thesaurus([table]),
        codeMember = UDC.Member('Space', 'countryCode', 'in'),
        nameMember = thesaurus.translate(codeMember, 'countryName');

    expect(nameMember.codeList).toBe('countryName');
    expect(nameMember.code).toBe('India');
  });

  // ## Hierarchies
  var trees = {};
  trees.unLocations = {
   "dimension": "Space",
   "codeList": "countryName",
   "code": "World",
   "children": [
    {
     "code": "Asia",
     "children": [
      {
       "code": "Southern Asia",
       "children": [
        {"code": "India"},
       ]
      },
      {
       "code": "Eastern Asia",
       "children": [
        {"code": "China"},
       ]
      }
     ]
    },
    {
     "code": "Americas",
     "children": [
      {
       "code": "Northern America",
       "children": [
        {"code": "United States of America"}
       ]
      }
     ]
    }
   ]
  };
  trees.usLocations = {
   "dimension": "Space",
   "codeList": "usLocationNames",
   "code": "USA",
   "children": [
    { "code": "California" },
    { "code": "Texas" },
    { "code": "New York" }
   ]
  };

  it('can load a hierarchy', function() {
    // `UDC.Hierarchy(tree)` is the hierarchy constructor function.
    var hierarchy = UDC.Hierarchy(trees.unLocations);
    expect(hierarchy.dimension).toBe('Space');
    expect(hierarchy.tree.member.key).toBe('countryName|World');
    expect(hierarchy.tree.children[0].children[0].children[0].member.key)
      .toBe('countryName|India');
  });

  it('can merge two hierarchies', function() {
    var hierarchyA = UDC.Hierarchy(trees.unLocations),
        hierarchyB = UDC.Hierarchy(trees.usLocations),
        thesaurus = UDC.Thesaurus([tables.unUsLocations]),
        hierarchy = UDC.mergeHierarchies(hierarchyA, hierarchyB);
    //console.log(JSON.stringify(hierarchy, null, 2));
    //expect(hierarchy.dimension).toBe('Space');
    //expect(hierarchy.tree.member.key).toBe('countryName|World');
    //expect(hierarchy.tree.children[0].children[0].children[0].member.key)
    //  .toBe('countryName|India');
  });

  // ## Merging Cubes
  it('can merge two cubes with the same domain', function() {
    var thesaurus = UDC.Thesaurus([tables.countryNamesAndCodes]),
        cubeA = UDC.Cube(tables.countryPopulations),
        cubeB = UDC.Cube(tables.countryGDP),
        /* TODO think about API changes: [cubes], [thesauruss]
         *      possibly remove UDC.Thesaurus() constructor?
         *      alternative: thesaurusPool
         * TODO think about reactive models - recanonicalize when thesauruss added.*/
        cube = UDC.mergeCubes(cubeA, cubeB, thesaurus),
        index = UDC.CubeIndex(cube.observations),
        cell = UDC.Cell([UDC.Member('Space', 'countryCode', 'in')]),
        populationValue = index.values(cell)['Population'],
        gdpValue = index.values(cell)['Gross Domestic Product'];

    // TODO check validity of these values with scales as actual data
    expect(populationValue).toBe(1.237 * 1000000000);
    expect(gdpValue).toBe(4716 * 1000);
  });


});
