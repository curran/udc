var requirejs = require('requirejs'),
    expect = require('chai').expect,
    data = require('./data.js');

requirejs.config({
  baseUrl: 'src',
  paths: { _: '../bower_components/lodash/dist/lodash.min' }
});

describe('UDC', function() {
  var udc = requirejs('udc');

  // Members are (dimension, codelist, code) tuples.
  it('should resolve equality of members', function() {
    expect(     udc.getMember('Space', 'countryCode', 'in').id)
      .to.equal(udc.getMember('Space', 'countryCode', 'in').id);
    expect(     udc.getMember('Space', 'countryName', 'United States of America').id)
      .to.equal(udc.getMember('Space', 'countryName', 'United States of America').id);
  });

  it('should resolve equality of cells', function() {
    var a = udc.getCell([
          udc.getMember('Space', 'ISO 3166-1 alpha-3', 'CHN'),
          udc.getMember('Time', 'year', '1960')
        ]),
        b = udc.getCell([
          udc.getMember('Space', 'ISO 3166-1 alpha-3', 'CHN'),
          udc.getMember('Time', 'year', '1960')
        ]);
    expect(a.key).to.equal(b.key);
  });

  it('should load a data cube', function() {
    var table = data.tables.countryPopulations,
        cube = udc.createCube(table),
        index = udc.createCubeIndex(cube.observations),
        cell = udc.getCell([udc.getMember('Space', 'countryCode', 'in')]),
        measure = 'Population',
        value = index.values(cell)[measure];

    expect(value).to.equal(1.237 * 1000000000);
  });

  it('should load a thesaurus', function() {
    var table = data.tables.countryNamesAndCodes,
        thesaurus = udc.createThesaurus([table]),
        codegetMember = udc.getMember('Space', 'countryCode', 'in'),
        namegetMember = thesaurus.translate(codegetMember, 'countryName');

    expect(namegetMember.codeList).to.equal('countryName');
    expect(namegetMember.code).to.equal('India');
  });

  it('should load a hierarchy', function() {
    var hierarchy = udc.Hierarchy(data.trees.unLocations);
    expect(hierarchy.dimension).to.equal('Space');
    expect(hierarchy.tree.member.codeList).to.equal('countryName');
    expect(hierarchy.tree.member.code).to.equal('World');
    expect(hierarchy.tree.children[0].children[0].children[0].member.codeList)
      .to.equal('countryName');
    expect(hierarchy.tree.children[0].children[0].children[0].member.code)
      .to.equal('India');
  });

  it('should merge two hierarchies', function() {
    var hierarchyA = udc.Hierarchy(data.trees.unLocations),
        hierarchyB = udc.Hierarchy(data.trees.usLocations),
        thesaurus = udc.createThesaurus([data.tables.unUsLocations]),
        hierarchy = udc.mergeHierarchies(hierarchyA, hierarchyB, thesaurus),
        world = hierarchy.tree,
        americas,
        northernAmerica,
        usa;
    expect(hierarchy.dimension).to.equal('Space');
    expect(hierarchy.tree.member.codeList).to.equal('countryName');
    expect(hierarchy.tree.member.code).to.equal('World');

    americas = child(world, 'Americas');
    expect(americas.member.id).to.equal(udc.getMember('Space', 'countryName', 'Americas').id);

    northernAmerica = child(americas, 'Northern America');
    expect(northernAmerica.member.key).to.equal(udc.getMember('Space', 'countryName', 'Northern America').key);

    usa = child(northernAmerica, 'United States of America');
    expect(usa.member.key).to.equal(udc.getMember('Space', 'countryName', 'United States of America').key);

    california = child(usa, 'California');
    expect(california.member.key).to.equal(udc.getMember('Space', 'usLocationName', 'California').key);
  });
  function child(tree, code){
    return tree.children.filter(function (node) {
      return node.member.code === code;
    })[0];
  }

  it('should merge two cubes with the same domain', function() {
    var thesaurus = udc.createThesaurus([data.tables.countryNamesAndCodes]),
        cubeA = udc.createCube(data.tables.countryPopulations),
        cubeB = udc.createCube(data.tables.countryGDP),
        cube = udc.mergeCubes(cubeA, cubeB, thesaurus),
        index = udc.createCubeIndex(cube.observations),
        cell = udc.getCell([udc.getMember('Space', 'countryCode', 'in')]),
        values = index.values(cell);

    expect(values.Population).to.equal(1.237 * 1000000000);
    expect(values['Gross Domestic Product']).to.equal(4716 * 1000);
  });

  it('should load UN population data', function(done) {
    data.load('tests/data/total_population', function (table) {
      var cube = udc.createCube(table),
          index = udc.createCubeIndex(cube.observations),
          chinaIn1960 = [
            udc.getMember('Space', 'UN M.49', '156'),
            udc.getMember('Time', 'year', '1960')
          ],
          cell = udc.getCell(chinaIn1960),
          values = index.values(cell);

      expect(values.Population).to.equal(650680.114 * 1000);
      done();
    });
  });
  it('should load World Bank GDP data', function(done) {
    data.load('tests/data/GDP_current_USD', function (table) {
      var cube = udc.createCube(table),
          index = udc.createCubeIndex(cube.observations),
          chinaIn1960 = [
            udc.getMember('Space', 'ISO 3166-1 alpha-3', 'CHN'),
            udc.getMember('Time', 'year', '1960')
          ],
          cell = udc.getCell(chinaIn1960),
          values = index.values(cell);

      expect(values['Gross Domestic Product (current US$)']).to.equal(61377930682.0013);
      done();
    });
  });
  it('should merge UN population data and World Bank DGP data', function(done) {
    data.load('tests/data/GDP_current_USD', function (tableA) {
      data.load('tests/data/total_population', function (tableB) {
        data.load('tests/data/locations', function (concordance) {
          var thesaurus = udc.createThesaurus([concordance]),
              cubeA = udc.createCube(tableA),
              cubeB = udc.createCube(tableB),
              cube = udc.mergeCubes(cubeA, cubeB, thesaurus),
              index = udc.createCubeIndex(cube.observations),
              chinaIn1960 = [
                udc.getMember('Space', 'ISO 3166-1 alpha-3', 'CHN'),
                udc.getMember('Time', 'year', '1960')
              ],
              cell = udc.getCell(chinaIn1960),
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
      var fullCube = udc.createCube(table),
          year2010 = udc.getMember('Time', 'year', '2010'),
          cube = udc.slice(fullCube, year2010),
          index = udc.createCubeIndex(cube.observations),
          china = [ udc.getMember('Space', 'UN M.49', '156') ],
          cell = udc.getCell(china),
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
