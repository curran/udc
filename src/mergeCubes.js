define(['_', 'cubeIndex', 'cell'], function (_, CubeIndex, Cell) {

  // Canonicalizes and merges two cubes.
  //
  // TODO separate canonicalization and merging completely
  return function mergeCubes(cubeA, cubeB, thesaurus) {
    var a = thesaurus.canonicalizeCube(cubeA),
        b = thesaurus.canonicalizeCube(cubeB);
    return simpleMerge(a, b);
  };
  
  // Merges two canonicalized cubes.
  function simpleMerge(a, b){
    var dimensions = _.intersection(a.dimensions, b.dimensions),
        measures = _.union(a.measures, b.measures),
        indexA = CubeIndex(a.observations),
        indexB = CubeIndex(b.observations),

        // TODO cells = join of members for each dimension
        // TODO add unit tests for the join
        //
        // Options:
        //
        //  * Inner Join
        //    * requires observations in both cubes with matching cells
        //    * produces integrated cubes with no missing values
        //    * may exclude data
        //  * Outer Join - Produces integrated cubes with missing data
        //    * requires observations with equivalent cells in one cube or the other, or both
        //    * produces integrated cubes with missing values
        //    * includes all original data
        //
        // Currently the implementation just uses all the cells present in a's observations.
        cells = _.pluck(a.observations, 'cell');
        
        // Combine values from every pair of observations
        observations = cells.map(function (cell) {
          var valuesA = indexA.values(cell),
              valuesB = indexB.values(cell);
          // TODO create a module for Observations
          return {
            cell: cell,
            // TODO take average of measures found in both
            // TODO think about tracking difference values
            values: _.extend(valuesA, valuesB)
          };
        });
    
    // TODO create a module for Cubes
    return {
      dimensions: dimensions,
      measures: measures,
      observations: observations
    };
  }
});
