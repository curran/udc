define(['getMember', 'getCell'], function (getMember, getCell) {
  // Observation objects contain:
  //
  //  * cell: Cell - The Cell defining the domain of this createObservation.
  //  * values: { measureName -> Number } - An object that maps measures to values.
  return function createObservation(row, dimensionColumns, measureColumns) {

    // Look up the cell corresponding to the unique set of members
    // expressed in the dimension columns of the given row.
    var cell = getCell(dimensionColumns.map(function (d) {
          var dimension = d.dimension,
              codeList = d.codeList,
              code = row[d.column];
          return getMember(dimension, codeList, code);
        })),
        values = {};

    // Populate the `values` object, which maps measures
    // to numeric values adjusted to the scale of each measureColumn.
    measureColumns.forEach(function (d) {
      values[d.measure] = row[d.column] * d.scale;
    });

    return {
      cell: cell,
      values: values
    };
  };
});
