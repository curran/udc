define(['_', 'member', 'cell'], function (_, Member, Cell) {

  return function Cube (table) {
    var dimensionColumns = table.dimensionColumns,
        measureColumns = table.measureColumns,
        observations = table.rows.map(function (row) {
          return Observation(row, dimensionColumns, measureColumns);
        });


//        members = {};
//
//    dimensions.forEach(function (dimension) {
//      members[dimension] = _.unique(observations.map(function (observation) {
//        return observation.cell[dimension].code;
//      }));
//    });
//
//    console.log(members);

    return {
      dimensions: _.pluck(dimensionColumns, 'dimension'),
      measures: _.pluck(measureColumns, 'measure'),
      observations: observations
    };
  };

  function Observation(row, dimensionColumns, measureColumns) {
    var observation = {
      cell: Cell(dimensionColumns.map(function (dimensionColumn) {
        var dimension = dimensionColumn.dimension,
            codeList = dimensionColumn.codeList,
            code = row[dimensionColumn.column];
        return Member(dimension, codeList, code);
      })),
      values: {}
    };

    measureColumns.forEach(function (d) {
      observation.values[d.measure] = row[d.column] * d.scale;
    });

    console.log(JSON.stringify(observation));
    return observation;
  }
});
