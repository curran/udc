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
  //
  // Concepts:
  //
  //  * universal elements
  //    * dimension
  //    * member
  //    * code list
  //    * code
  //    * measure
  //  * local elements
  //    * table
  //    * concordance
  //    * cube
  //    * hierarchy
  //
  // Tasks:
  //
  //  * load data cube
  //  * load concordance
  //  * query for values
  //  * slice
  //  * merge data cubes
  //  * load hierarchy
  //  * merge hierarchies

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
  // Tables are used as input for creating cubes and concordances.
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

        // `cube.value(cell, measure)` queries the cube for values.
        //   * `cell` an object that specifies the combination of dimension 
        //     members used to look up the value. A cell corresponds to a `row`
        //     in the original table used to create the cube.
        //     * Keys are dimension names
        //     * Values are `member` objects
        //       * `member.codeList` the code list used
        //       * `member.code` the code for this member
        member = {
          codeList: 'countryCode',
          code: 'in'
        },
        cell = {
          Space: member
        },
        //   * `measure` the measure name
        measure = 'Population',
        value = cube.value(cell, measure);

    expect(value).toBe(1.237 * 1000000000);
  });

  // ## Concordance
  // Concordance tables are referred to as "concordances".
  //
  // A concordance defines equivalence classes for dimension members
  // by matching up codes between two or more code lists.
  //
  // For example, one code list could define matches between two-character
  // country codes and full country names.
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

  it('can load a concordance', function() {
    var table = tables.countryNamesAndCodes,

        // `UDC.Concordance(table)` is the concordance constructor function.
        concordance = UDC.Concordance(table),
        codeMember = {
          codeList: 'countryCode',
          code: 'in'
        },
        nameMember = concordance.translate(codeMember, 'countryName');
    expect(nameMember.codeList).toBe('countryName');
    expect(nameMember.code).toBe('India');
  });

  // Merging Cubes
  it('can merge two cubes', function() {
    var concordance = UDC.Concordance(tables.countryNamesAndCodes),
        cubeA = UDC.Cube(tables.countryPopulations),
        cubeB = UDC.Cube(tables.countryGDP),
        cube = UDC.mergeCubes(cubeA, cubeB, concordance),
        cell = {
          Space: {
            codeList: 'countryCode',
            code: 'in'
          }
        },
        populationValue = cube.value(cell, 'Population'),
        gdpValue = cube.value(cell, 'Gross Domestic Product');

    // TODO check validity of these values with scales as actual data
    expect(populationValue).toBe(1.237 * 1000000000);
    expect(gdpValue).toBe(4716 * 1000);
  });

});
