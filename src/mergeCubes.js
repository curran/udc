define(['_', 'cubeIndex'], function (_, CubeIndex) {

  return function mergeCubes(cubeA, cubeB, concordance) {
    var a = canonicalizeCube(cubeA, concordance),
        b = canonicalizeCube(cubeB, concordance);
    return simpleMerge(a, b);
  };

  function canonicalizeCube(cube, concordance){

    // Keys are dimensions
    // values are canonical codeLists chosen for each dimension
    var canonicalCodeLists = {};

    // Use the first code list in alpha sorted order as the canonical one.
    canonicalCodeLists[concordance.dimension] = concordance.codeLists.sort()[0];

    function canonicalizeObservation(observation){
      var canonicalCell = {};

      cube.dimensions.forEach(function (dimension) {
        var member = observation.cell[dimension],
            canonicalCodeList = canonicalCodeLists[dimension];
        canonicalCell[dimension] = concordance.translate(member, canonicalCodeList);
      });

      return {
        cell: canonicalCell,
        values: observation.values
      };
    }

    return {
      dimensions: cube.dimensions,
      codeLists: cube.codeLists,
      measures: cube.measures,
      observations: cube.observations.map(canonicalizeObservation)
    }; 
  }
  
  function simpleMerge(a, b){
    var dimensions = _.intersection(a.dimensions, b.dimensions),
        measures = _.union(a.measures, b.measures),
        indexA = CubeIndex(a.observations),
        indexB = CubeIndex(b.observations),

        // TODO cells = cartesian product of members for each dimension
        cells = _.pluck(a.observations, 'cell');
        
        observations = cells.map(function (cell) {
          var valuesA = indexA.values(cell),
              valuesB = indexB.values(cell);
          return {
            cell: cell,
            values: _.extend(valuesA, valuesB)
          };
        });
    
    return {
      dimensions: dimensions,
      measures: measures,
      observations: observations
    };
  }
});
