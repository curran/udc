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
          chinaIn1960 = [
            udc.Member('Space', 'UN M.49', '156'),
            udc.Member('Time', 'year', '1960')
          ],
          cell = udc.Cell(chinaIn1960),
          values = index.values(cell);

      expect(values.Population).to.equal(650680.114 * 1000);
      done();
    });
  });
  it('should load World Bank GDP data', function(done) {
    data.load('tests/data/GDP_current_USD', function (table) {
      var cube = udc.Cube(table),
          index = udc.CubeIndex(cube.observations),
          chinaIn1960 = [
            udc.Member('Space', 'ISO 3166-1 alpha-3', 'CHN'),
            udc.Member('Time', 'year', '1960')
          ],
          cell = udc.Cell(chinaIn1960),
          values = index.values(cell);

      expect(values['Gross Domestic Product (current US$)']).to.equal(61377930682.0013);
      done();
    });
  });
  it('should merge UN population data and World Bank DGP data', function(done) {
    data.load('tests/data/GDP_current_USD', function (tableA) {
      data.load('tests/data/total_population', function (tableB) {
        data.load('tests/data/locations', function (concordance) {
          var thesaurus = udc.Thesaurus([concordance]),
              cubeA = udc.Cube(tableA),
              cubeB = udc.Cube(tableB),
              cube = udc.mergeCubes(cubeA, cubeB, thesaurus),
              index = udc.CubeIndex(cube.observations),
              chinaIn1960 = [
                udc.Member('Space', 'ISO 3166-1 alpha-3', 'CHN'),
                udc.Member('Time', 'year', '1960')
              ],
              cell = udc.Cell(chinaIn1960),
              canonicalCell = thesaurus.canonicalizeCell(cell),
              values = index.values(canonicalCell);

          expect(values['Gross Domestic Product (current US$)']).to.equal(61377930682.0013);
          expect(values.Population).to.equal(650680.114 * 1000);
          done();
        });
      });
    });
  });

  it('should slice by a single year', function(done) {
    data.load('tests/data/total_population', function (table) {
      var fullCube = udc.Cube(table),
          year2010 = udc.Member('Time', 'year', '2010'),
          cube = udc.slice(fullCube, year2010),
          index = udc.CubeIndex(cube.observations),
          china = [ udc.Member('Space', 'UN M.49', '156') ],
          cell = udc.Cell(china),
          values = index.values(cell);

      expect(values.Population).to.equal(1359821.465 * 1000);

      expect(cube.dimensions.length).to.equal(1);
      expect(cube.dimensions[0]).to.equal('Space');

      expect(cube.observations[0].cell.members.length).to.equal(1);
      expect(cube.observations[0].cell.members[0].dimension).to.equal('Space');

      expect(cube.observations.length).to.equal(3);

      done();
    });
  });
});
