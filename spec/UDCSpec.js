// Unit tests for the UDC library. Also serves as the user guide.
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
  //  * merge data cubes
  //  * load hierarchy
  //  * merge hierarchies
  //  * query for values


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
  // ## Tables
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
    //    describe how columns in the table relate to universal dimensions.
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
    "measureColumns": [
      { "measure": "Population", "scale": 1000000000, "column": "Pop" }
    ]
  };

  it('can load a data cube', function() {
    var table = tables.countryPopulations,
        cube = UDC.Cube(table);
  });
});
