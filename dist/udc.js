(function(root, factory) {
    if(typeof exports === 'object') {
        module.exports = factory();
    }
    else if(typeof define === 'function' && define.amd) {
        define([], factory);
    }
    else {
        root['UDC'] = factory();
    }
}(this, function() {

/* TODO refactor code structure to use AMD. */
var UDC = {};

UDC.Cube = function (table) {
  var index = {};

  table.rows.forEach(function (row) {
    var cell = {},
        values = {};

    table.dimensionColumns.forEach(function (dimensionColumn) {
      cell[dimensionColumn.dimension] = {
        codeList: dimensionColumn.codeList,
        code: row[dimensionColumn.column]
      };
    });

    table.measureColumns.forEach(function (measureColumn) {
      values[measureColumn.measure] = row[measureColumn.column] * measureColumn.scale;
    });

    index[key(cell)] = values;
  });

  return {
    value: function (cell, measure) {
      return index[key(cell)][measure];
    },
    observations: table.rows
  };

  function key(cell){
    return Object.keys(cell).sort().map(function (dimension) {
      var member = cell[dimension];
      return member.codeList + ':' + member.code;
    }).join(',');
  }
};

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
  }

  return function (cubeA, cubeB, concordance) {
    var a = canonicalizeCube(cubeA, concordance),
        b = canonicalizeCube(cubeB, concordance);
    console.log(a);
    return simpleMerge(a, b);
  };
}());


return UDC;

}));
