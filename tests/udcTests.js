// TODO slice
var requirejs = require('requirejs'),
    expect = require('chai').expect,
    data = require('./data.js');

requirejs.config(require('./requireConfig.js'));

describe('UDC', function(done) {
  var udc;

  it('should load required AMD modules', function(done) {
    requirejs(['udc'], function (_udc) {
      udc = _udc;
      done();
    });
  });

  it('should load a data cube', function() {
    var table = data.tables.countryPopulations,
        cube = udc.Cube(table),
        index = udc.CubeIndex(cube.observations),
        cell = udc.Cell([udc.Member('Space', 'countryCode', 'in')]),
        measure = 'Population',
        value = index.values(cell)[measure];

    expect(value).to.equal(1.237 * 1000000000);
  });

  it('should load a thesaurus', function() {
    var table = data.tables.countryNamesAndCodes,
        thesaurus = udc.Thesaurus([table]),
        codeMember = udc.Member('Space', 'countryCode', 'in'),
        nameMember = thesaurus.translate(codeMember, 'countryName');

    expect(nameMember.codeList).to.equal('countryName');
    expect(nameMember.code).to.equal('India');
  });

  it('should load a hierarchy', function() {
    var hierarchy = udc.Hierarchy(data.trees.unLocations);
    expect(hierarchy.dimension).to.equal('Space');
    expect(hierarchy.tree.member.key).to.equal('countryName|World');
    expect(hierarchy.tree.children[0].children[0].children[0].member.key)
      .to.equal('countryName|India');
  });

  it('should merge two hierarchies', function() {
    var hierarchyA = udc.Hierarchy(data.trees.unLocations),
        hierarchyB = udc.Hierarchy(data.trees.usLocations),
        thesaurus = udc.Thesaurus([data.tables.unUsLocations]),
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

  it('should merge two cubes with the same domain', function() {
    var thesaurus = udc.Thesaurus([data.tables.countryNamesAndCodes]),
        cubeA = udc.Cube(data.tables.countryPopulations),
        cubeB = udc.Cube(data.tables.countryGDP),
        cube = udc.mergeCubes(cubeA, cubeB, thesaurus),
        index = udc.CubeIndex(cube.observations),
        cell = udc.Cell([udc.Member('Space', 'countryCode', 'in')]),
        values = index.values(cell);

    expect(values.Population).to.equal(1.237 * 1000000000);
    expect(values['Gross Domestic Product']).to.equal(4716 * 1000);
  });

  it('should load UN population data', function(done) {
    data.load('tests/data/total_population', function (table) {
      var cube = udc.Cube(table),
          index = udc.CubeIndex(cube.observations),
          cell = udc.Cell([
            udc.Member('Space', 'UN M.49', '356'),
            udc.Member('Time', 'year', '1960')
          ]),
          measure = 'Population',
          value = index.values(cell)[measure];

      expect(value).to.equal(449595.489 * 1000);
      done();
    });
  });
});
