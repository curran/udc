define([], function () {
  function key(cell){
    return Object.keys(cell).sort().map(function (dimension) {
      var member = cell[dimension];
      return member.codeList + ':' + member.code;
    }).join(',');
  }

  function CubeIndex(observations) {
    var index = {};

    observations.forEach( function (observation) {
      index[key(observation.cell)] = observation.values;
    });

    return index;
  }

  function Observation(row, dimensionColumns, measureColumns) {
    var cell = {},
        values = {};

    dimensionColumns.forEach(function (d) {
      cell[d.dimension] = {
        codeList: d.codeList,
        code: row[d.column]
      };
    });

    measureColumns.forEach(function (d) {
      values[d.measure] = row[d.column] * d.scale;
    });

    return {
      cell: cell,
      values: values
    };
  }

  return function Cube (table) {
    var observations = table.rows.map(function (row) {
          return Observation(row, table.dimensionColumns, table.measureColumns);
        }),
        index = CubeIndex(observations),
        dimensions = table.dimensionColumns.map(function (dimensionColumn) {
          return dimensionColumn.dimension;
        });

    return {
      value: function (cell, measure) {
        return index[key(cell)][measure];
      },
      observations: observations,
      dimensions: dimensions
    };
  };
});
