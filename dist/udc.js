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
    }
  };

  function key(cell){
    return Object.keys(cell).sort().map(function (dimension) {
      var member = cell[dimension];
      return member.codeList + ':' + member.code;
    }).join(',');
  }
};

UDC.Concordance = function (table) {
  var indices = {};

  table.dimensionColumns.forEach(function (dimensionColumn) {
    indices[dimensionColumn.codeList] = {};
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
    }
  };
};


return UDC;

}));
