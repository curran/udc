define([], function () {
  return function Cube (table) {
    var index = {},
        observations = table.rows.map(function (row) {
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

          return { cell: cell, values: values };
        }),
        dimensions = table.dimensionColumns.map(function (dimensionColumn) {
          return dimensionColumn.dimension;
        });

    function key(cell){
      return Object.keys(cell).sort().map(function (dimension) {
        var member = cell[dimension];
        return member.codeList + ':' + member.code;
      }).join(',');
    }

    return {
      value: function (cell, measure) {
        return index[key(cell)][measure];
      },
      observations: observations,
      dimensions: dimensions
    };
  };
});
