define(['_', 'getMember', 'getCell'], function (_, getMember, getCell) {

  // Creates a cube from the given `table` object, where
  //
  //  * `table.rows` an array of `row` objects where
  //    * Keys are column names
  //    * Values are numbers or strings
  //  * `table.dimensionColumns` an array of `dimensionColumn` objects that 
  //    describe how columns in the table relate to dimensions.
  //    * `column` the column name (key in `row` objects)
  //    * `dimension` the name of the dimension
  //    * `codeList` the name of the code list used by `row` objects.
  //      For each `row` in `table.rows`, `row[column]` yields a string 
  //      that is a code from this code list.
  //  * `table.measureColumns` an array of `measureColumn` objects that 
  //    describe how columns in the table relate to measures.
  //    * `column` the column name (key in `row` objects)
  //    * `measure` the name of the measure
  //    * `scale` the scale factor used by values.
  //      For each `row` in `table.rows`, `row[column]` yields a number `x` 
  //      such that <br> `x * scale` yields the measure value.
  return function createCube (table) {
    var dimensionColumns = table.dimensionColumns,
        measureColumns = table.measureColumns,
        observations = table.rows.map(function (row) {
          return Observation(row, dimensionColumns, measureColumns);
        });

    return {
      dimensions: _.pluck(dimensionColumns, 'dimension'),
      measures: _.pluck(measureColumns, 'measure'),
      observations: observations
    };
  };

  // Observation objects contain:
  //
  //  * cell: Cell - The Cell defining the domain of this Observation.
  //  * values: { measureName -> Number } - An object that maps measures to values.
  function Observation(row, dimensionColumns, measureColumns) {
    var observation = {
      cell: getCell(dimensionColumns.map(function (dimensionColumn) {
        var dimension = dimensionColumn.dimension,
            codeList = dimensionColumn.codeList,
            code = row[dimensionColumn.column];
        return getMember(dimension, codeList, code);
      })),

      /* TODO think about not creating this object,
       * and providing a function instead f(measure) -> Number */
      values: {}
    };

    measureColumns.forEach(function (d) {
      observation.values[d.measure] = row[d.column] * d.scale;
    });

    return observation;
  }
});
