define(['_', 'cube'], function (_, Cube) {
  var UDC = {
    Cube: Cube
  };

  console.log(_);

  UDC.Concordance = function (table) {
    var indices = {},
        codeLists = [],
        dimension = table.dimensionColumns[0].dimension;

    table.dimensionColumns.forEach(function (dimensionColumn) {
      var codeList = dimensionColumn.codeList;
      codeLists.push(codeList);
      indices[codeList] = {};
    });

    table.rows.forEach(function (row) {
      var equivalenceClass = {};
      table.dimensionColumns.forEach(function (dimensionColumn) {
        var codeList = dimensionColumn.codeList,
            code = row[dimensionColumn.column];
        equivalenceClass[codeList] = { codeList: codeList, code: code };
        indices[codeList][code] = equivalenceClass;
      });
    });

    return {
      translate: function (member, codeList) {
        return indices[member.codeList][member.code][codeList];
      },
      codeLists: codeLists,
      dimension: dimension
    };
  };

  UDC.mergeCubes = (function () {

    function canonicalizeCube(cube, concordance){

      // Keys are dimensions
      // values are canonical codeLists chosen for each dimension
      var canonicalCodeLists = {};

      // Use the first code list in alpha sorted order as the canonical one.
      canonicalCodeLists[concordance.dimension] = concordance.codeLists.sort()[0];

      return {
        dimensions: cube.dimensions,
        measures: cube.measures,
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
    }

    return function (cubeA, cubeB, concordance) {
      var a = canonicalizeCube(cubeA, concordance),
          b = canonicalizeCube(cubeB, concordance);
      return simpleMerge(a, b);
    };
  }());

  return UDC;
});
