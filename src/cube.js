define([], function () {

  function Observation(row, dimensionColumns, measureColumns) {
    var observation = {
      cell: {},
      values: {}
    };

    dimensionColumns.forEach(function (d) {
      observation.cell[d.dimension] = {
        codeList: d.codeList,
        code: row[d.column]
      };
    });

    measureColumns.forEach(function (d) {
      observation.values[d.measure] = row[d.column] * d.scale;
    });

    return observation;
  }

  return function Cube (table) {
    var dimensionColumns = table.dimensionColumns,
        measureColumns = table.measureColumns,
        observations = table.rows.map(function (row) {
          return Observation(row, dimensionColumns, measureColumns);
        }),
        dimensions = dimensionColumns.map(function (d) { return d.dimension; }),
        measures = measureColumns.map(function (d) { return d.measure; }),
        codeLists = {};

    table.dimensionColumns.forEach(function (d) {
      codeLists[d.dimension] = d.codeList;
    });

    return {
      //dimensions: dimensions,
      //measures: measures,
      observations: observations
      //codeLists: codeLists,
    };
  };
});
