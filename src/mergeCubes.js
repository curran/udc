define(['_', 'cubeIndex', 'Cell', 'Member'], function (_, CubeIndex, Cell, Member) {

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

    return {
      dimensions: cube.dimensions,
      measures: cube.measures,
      observations: cube.observations.map(canonicalizeObservation)
    }; 

    function canonicalizeObservation(observation){
      return {
        cell: canonicalizeCell(observation.cell),
        values: observation.values
      };
    }
    function canonicalizeCell(cell){
      return Cell(cell.members.map(canonicalizeMember));
      var canonicalCell = {};
    }
    function canonicalizeMember(member){
      var canonicalCodeList = canonicalCodeLists[member.dimension];
      return concordance.translate(member, canonicalCodeList);
    }
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