// Implements the Thesaurus concept of the Universal Data Cube data structure.
//
// The purpose of a Thesaurus is to canonicalize Cubes so they can be merged.
define(['getMember', 'getCell'], function (getMember, getCell) {

  // A Thesaurus is constructed from many datasets.
  return function Thesaurus (datasets) {
    
    // index[dimension][codelist][code] = equivalenceClass
    // equivalenceClass[codelist] = Member
    var index = {},

        // canonicalCodelists[dimension] = codelist
        canonicalCodelists = {};

    // Build the index.
    datasets.forEach(function (dataset) {

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
              member = getMember(dimension, codelist, code),

              // Get or create the index bucket for the Member object.
              dimensionIndex = index[dimension] || (index[dimension] = {}),
              codelistIndex = dimensionIndex[codelist] || (dimensionIndex[codelist] = {});

          // Add the Member to the equivalence class.
          equivalenceClass[codelist] = member;

          // Add the equivalence class to the Thesaurus index.
          codelistIndex[code] = equivalenceClass;

        });
      });
    });

    // Derive canonical code lists for each dimension.
    var dimensions = Object.keys(index);
    dimensions.forEach(function (dimension) {
      var codelists = Object.keys(index[dimension]);
      canonicalCodelists[dimension] = codelists.sort()[0];
    });

    // Translates the given member to the given code list.
    function translate(member, codelist){
      return index[member.dimension][member.codeList][member.code][codelist];
    }

    // Translates the given member to the canonical code list for its dimension.
    function canonicalizeMember(member){
      var dimensionIndex = index[member.dimension],
          codelistIndex,
          codelist;
      if(dimensionIndex) {
        codelistIndex = dimensionIndex[member.codeList];
        if(codelistIndex.hasOwnProperty(member.code)) {
          codelist = canonicalCodelists[member.dimension];
          return codelistIndex[member.code][codelist];

          // TODO find a case where this is necessary
          //var equivalenceClass = codelistIndex[member.code],
          //    codelists = canonicalCodelists[member.dimension],
          //    codelist,
          //    i;
          //console.log(equivalenceClass);
          //for(i = 0; i < codelists.length; i++) {
          //  codelist = codelists[i];
          //  if(equivalenceClass.hasOwnProperty(codelist)) {
          //    return equivalenceClass[codelist];
          //  }
          //}
        }
      }
      return member;
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
