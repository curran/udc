define(['_', 'cubeIndex', 'cell', 'member'], function (_, CubeIndex, Cell, Member) {

  return function mergeCubes(cubeA, cubeB, thesaurus) {
    var a = thesaurus.canonicalizeCube(cubeA),
        b = thesaurus.canonicalizeCube(cubeB);
    return simpleMerge(a, b);
  };
  
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
