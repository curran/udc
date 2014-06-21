define(['getMember', 'cell'], function (getMember, Cell) {
  return function Thesaurus (tables) {

    
    var index = {},
        canonicalCodeLists = {};

    // Build the index.
    tables.forEach(function (table) {
      table.rows.forEach(function (row) {
        var equivalenceClass = {};
        table.dimensionColumns.forEach(function (dimensionColumn) {
          var dimension = dimensionColumn.dimension,
              codeList = dimensionColumn.codeList,
              code = row[dimensionColumn.column],
              member = getMember(dimension, codeList, code),
              dimensionIndex = index[dimension] || (index[dimension] = {}),
              codeListIndex = dimensionIndex[codeList] || (dimensionIndex[codeList] = {});
          equivalenceClass[codeList] = member;
          codeListIndex[code] = equivalenceClass;
        });
      });
    });

    // Derive canonical code lists.
    Object.keys(index).forEach(function (dimension) {
      canonicalCodeLists[dimension] = Object.keys(index[dimension]).sort();
    });

    // Translates the given member to the given code list.
    function translate(member, codeList){
      return index[member.dimension][member.codeList][member.code][codeList];
    }

    // Translates the given member to the canonical code list for its dimension.
    function canonicalizeMember(member){
      var dimensionIndex = index[member.dimension],
          codeListIndex,
          codeList;
      if(dimensionIndex) {
        codeListIndex = dimensionIndex[member.codeList];
        if(codeListIndex.hasOwnProperty(member.code)) {
          codeList = canonicalCodeLists[member.dimension][0];
          return codeListIndex[member.code][codeList];

          // TODO find a case where this is necessary
          //var equivalenceClass = codeListIndex[member.code],
          //    codeLists = canonicalCodeLists[member.dimension],
          //    codeList,
          //    i;
          //console.log(equivalenceClass);
          //for(i = 0; i < codeLists.length; i++) {
          //  codeList = codeLists[i];
          //  if(equivalenceClass.hasOwnProperty(codeList)) {
          //    return equivalenceClass[codeList];
          //  }
          //}
        }
      }
      return member;
    }

    // Translates the members of the given cell to the canonical code lists
    // for their respective dimensions.
    function canonicalizeCell(cell){
      return Cell(cell.members.map(canonicalizeMember));
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
