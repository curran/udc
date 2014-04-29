define([], function () {

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
      observations: cube.observations.map(function (observation) {
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
      })
    }; 
  }

  function simpleMerge(a, b){
    console.log(a);
    return a;
  }
});
