var requirejs = require('requirejs'),
    expect = require('chai').expect;

requirejs.config(require('./requireConfig.js'));

describe('UDC', function() {
  var udc;

  it('should load the AMD module', function(done) {
    requirejs(['udc'], function (_udc) {
      udc = _udc;
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
  // The Universal Data Cube (udc) library is for modeling data sets
  // as data cubes and integrating them together. The udc has two kinds of elements:
  //
  //  * 'universal elements' are shared by all data sets
  //  * 'local elements' are local to each data set
  //
  // By establishing a relationship between local elements and universal elements, the
  // udc library is able to integrate many data sets together that may:
  //
  //  * refer to the same entities using different identifiers, or
  //  * express the same numeric field using a different scale factor.
  //
  // ## Table
  //
  // In the udc library, the notion of a 'table' is a set of `row` objects
  // (e.g. rows parsed from a CSV file) and some additional metadata that states 
  // how the row objects relate to universal elements.
  var tables = {};

  tables.countryPopulations = {
    //  * `table.rows` an array of `row` objects where
    //    * Keys are column names
    //    * Values are numbers or strings
    'rows': [
      { 'Country': 'in', 'Pop': 1.237 },
      { 'Country': 'cn', 'Pop': 1.351 },
      { 'Country': 'us', 'Pop': 0.3139 }
    ],
    //  * `table.dimensionColumns` an array of `dimensionColumn` objects that 
    //    describe how columns in the table relate to dimensions.
    //    * `column` the column name (key in `row` objects)
    //    * `dimension` the name of the dimension
    //    * `codeList` the name of the code list used by `row` objects.
    //      For each `row` in `table.rows`, `row[column]` yields a string 
    //      that is a code from this code list.
    'dimensionColumns': [
      {
        'column': 'Country',
        'dimension': 'Space',
        'codeList': 'countryCode'
      }
    ],
    //  * `table.measureColumns` an array of `measureColumn` objects that 
    //    describe how columns in the table relate to measures.
    //    * `column` the column name (key in `row` objects)
    //    * `measure` the name of the measure
    //    * `scale` the scale factor used by values.
    //      For each `row` in `table.rows`, `row[column]` yields a number `x` 
    //      such that <br> `x * scale` yields the measure value.
    'measureColumns': [
      {
        'column': 'Pop',
        'measure': 'Population',
        'scale': 1000000000
      }
    ]
  };
  // Tables are used as input for creating cubes and thesauri.
  tables.countryGDP = {
    'rows': [
      { 'name': 'China', 'gdp': 12261 },
      { 'name': 'India', 'gdp': 4716 },
      { 'name': 'United States of America', 'gdp': 16244 }
    ],
    'dimensionColumns': [
      {
        'column': 'name',
        'dimension': 'Space',
        'codeList': 'countryName'
      }
    ],
    'measureColumns': [
      {
        'column': 'gdp',
        'measure': 'Gross Domestic Product',
        'scale': 1000
      }
    ]
  };

  // ## Cube
  // Data cubes are referred to as 'cubes'. A cube is a data set
  // that comes from a table that includes columns for dimensions
  // and measures.
  //
  //  * dimensions are sets of discrete entities
  //  * measures are aggregated numeric properties
  //
  // One example of cube is a data set that contains values for
  // population (number of people) in each of the three largest
  // countries of the world - China (ch), India (in) and the USA (us).
  it('should load a data cube', function() {
    var table = tables.countryPopulations,

        // `udc.Cube(table)` is the constructor function for cubes.
        cube = udc.Cube(table),

        index = udc.CubeIndex(cube.observations),

        // `cube.values(cell)` queries the cube for values.
        cell = udc.Cell([udc.Member('Space', 'countryCode', 'in')]),
        measure = 'Population',
        value = index.values(cell)[measure];

    expect(value).to.equal(1.237 * 1000000000);
  });

  // ## Thesaurus
  // Thesaurus tables are tables that provide equivalence mappings
  // between codes from different code lists. A collection of thesaurus
  // tables can be assembled into an equivalence index called a thesaurus.
  tables.countryNamesAndCodes = {
    'dimensionColumns': [
      { 'dimension': 'Space', 'codeList': 'countryName', 'column': 'Country' },
      { 'dimension': 'Space', 'codeList': 'countryCode', 'column': 'Code' }
    ],
    'rows': [
      { 'Country': 'India', 'Code': 'in' },
      { 'Country': 'China', 'Code': 'cn' },
      { 'Country': 'United States of America', 'Code': 'us' }
    ]
  };
  tables.unUsLocations = {
    'dimensionColumns': [
      { 'dimension': 'Space', 'codeList': 'countryName', 'column': 'unName' },
      { 'dimension': 'Space', 'codeList': 'usLocationName', 'column': 'usName' }
    ],
    'rows': [
      { 'unName': 'United States of America', 'usName': 'USA' }
    ]
  };

  it('should load a thesaurus', function() {
    var table = tables.countryNamesAndCodes,

        // `udc.Thesaurus([tables])` is the thesaurus constructor function.
        thesaurus = udc.Thesaurus([table]),
        codeMember = udc.Member('Space', 'countryCode', 'in'),
        nameMember = thesaurus.translate(codeMember, 'countryName');

    expect(nameMember.codeList).to.equal('countryName');
    expect(nameMember.code).to.equal('India');
  });

  // ## Hierarchies
  var trees = {};
  trees.unLocations = {
   'dimension': 'Space',
   'codeList': 'countryName',
   'code': 'World',
   'children': [
    {
     'code': 'Asia',
     'children': [
      {
       'code': 'Southern Asia',
       'children': [
        {'code': 'India'},
       ]
      },
      {
       'code': 'Eastern Asia',
       'children': [
        {'code': 'China'},
       ]
      }
     ]
    },
    {
     'code': 'Americas',
     'children': [
      {
       'code': 'Northern America',
       'children': [
        {'code': 'United States of America'}
       ]
      }
     ]
    }
   ]
  };
  trees.usLocations = {
   'dimension': 'Space',
   'codeList': 'usLocationName',
   'code': 'USA',
   'children': [
    { 'code': 'California' },
    { 'code': 'Texas' },
    { 'code': 'New York' }
   ]
  };

  it('should load a hierarchy', function() {
    // `udc.Hierarchy(tree)` is the hierarchy constructor function.
    var hierarchy = udc.Hierarchy(trees.unLocations);
    expect(hierarchy.dimension).to.equal('Space');
    expect(hierarchy.tree.member.key).to.equal('countryName|World');
    expect(hierarchy.tree.children[0].children[0].children[0].member.key)
      .to.equal('countryName|India');
  });

  it('should merge two hierarchies', function() {
    var hierarchyA = udc.Hierarchy(trees.unLocations),
        hierarchyB = udc.Hierarchy(trees.usLocations),
        thesaurus = udc.Thesaurus([tables.unUsLocations]),
        hierarchy = udc.mergeHierarchies(hierarchyA, hierarchyB, thesaurus);
    expect(hierarchy.dimension).to.equal('Space');
    expect(hierarchy.tree.member.key).to.equal('countryName|World');
    expect(hierarchy.tree.children[0].children[0].children[0].member.key)
      .to.equal('countryName|India');
    expect(hierarchy.tree.children[1].children[0].children[0].member.key)
      .to.equal('countryName|United States of America');
    expect(hierarchy.tree.children[1].children[0].children[0].children[0].member.key)
      .to.equal('usLocationName|California');
  });

  // ## Merging Cubes
  it('should merge two cubes with the same domain', function() {
    var thesaurus = udc.Thesaurus([tables.countryNamesAndCodes]),
        cubeA = udc.Cube(tables.countryPopulations),
        cubeB = udc.Cube(tables.countryGDP),
        /* TODO think about API changes: [cubes], [thesauruss]
         *      possibly remove udc.Thesaurus() constructor?
         *      alternative: thesaurusPool
         * TODO think about reactive models - recanonicalize when thesauruss added.*/
        cube = udc.mergeCubes(cubeA, cubeB, thesaurus),
        index = udc.CubeIndex(cube.observations),
        cell = udc.Cell([udc.Member('Space', 'countryCode', 'in')]),
        values = index.values(cell);

    expect(values.Population).to.equal(1.237 * 1000000000);
    expect(values['Gross Domestic Product']).to.equal(4716 * 1000);
  });
});