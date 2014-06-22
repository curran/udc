// Implements the Thesaurus concept of the Universal Data Cube data structure.
//
// The purpose of a Thesaurus is to canonicalize Cubes so they can be merged.
define(['getMember', 'getCell'], function (getMember, getCell) {

  // A Thesaurus is constructed from many datasets.
  return function Thesaurus (datasets) {
    
    // The index maps Members to their equivalence classes.
    //
    //  * `index[memberId] = equivalenceClass`
    //  * `equivalenceClass[codelist] = Member`
    var index = {},

        // Stores the set of codelists used by each dimension.
        // Used for determining canonical codelists later.
        //
        //  * `codelistsByDimension[dimension][codelist] = true`
        codelistsByDimension = {},

        // Stores canonical codelists for each dimension.
        //
        //  * `canonicalCodelists[dimension] = codelist`
        canonicalCodelists = {};

    // Build the index.
    datasets.forEach(function (dataset) {

      // For each dimensionColumn,
      dataset.dimensionColumns.forEach(function (d) {
        
        // store its codelist.
        var dimensionIndex = codelistsByDimension[d.dimension] || (codelistsByDimension[d.dimension] = {});
        dimensionIndex[d.codeList] = true;
      });

      // For each row of the dataset,
      dataset.rows.forEach(function (row) {

        // construct an equivalence class of Members.
        // equivalenceClass[codelist] = Member
        var equivalenceClass = {};

        // For each dimensionColumn,
        dataset.dimensionColumns.forEach(function (d) {

          // get the Member represented by the current row,
          var dimension = d.dimension,
              codelist = d.codeList,
              code = row[d.column],
              member = getMember(dimension, codelist, code);

          // add the Member to the equivalence class, and
          equivalenceClass[codelist] = member;

          // add the equivalence class to the index.
          index[member.id] = equivalenceClass;

        });
      });
    });

    // For each dimension,
    Object.keys(codelistsByDimension).forEach(function (dimension) {
      var codelists = Object.keys(codelistsByDimension[dimension]);

      // derive the canonical code lists by first sorting the codelists
      // for this dimension, then choosing the first one in sorted order.
      canonicalCodelists[dimension] = codelists.sort()[0];
    });

    // Translates the given member to the given code list.
    function translate(member, codelist){
      return index[member.id][codelist];
    }

    // Translates the given member to the canonical code list for its dimension.
    function canonicalizeMember(member){
      var equivalenceClass = index[member.id];
      if(equivalenceClass) {
        return equivalenceClass[canonicalCodelists[member.dimension]];
      } else {
        return member;
      }
    }

    // Translates the members of the given cell to the canonical code lists
    // for their respective dimensions.
    function canonicalizeCell(cell){
      return getCell(cell.members.map(canonicalizeMember));
    }

    // Translates the members of the cell of the given observation
    // to the canonical code lists for their respective dimensions.
    function canonicalizeObservation(observation){
      return {
        cell: canonicalizeCell(observation.cell),
        values: observation.values
      };
    }

    // Translates the members of the cells of the observations in the
    // given cube to the canonical code lists for their respective dimensions.
    function canonicalizeCube(cube){
      return {
        dimensions: cube.dimensions,
        measures: cube.measures,
        observations: cube.observations.map(canonicalizeObservation)
      }; 
    }

    return {
      translate: translate,
      canonicalizeMember: canonicalizeMember,
      canonicalizeCell: canonicalizeCell,
      //canonicalizeObservation: canonicalizeObservation,
      canonicalizeCube: canonicalizeCube
    };
  };
});
