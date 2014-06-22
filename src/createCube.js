define(['_', 'createObservation'], function (_, createObservation) {

  // Creates a cube from the given `dataset` object, where
  //
  //  * `dataset.rows` an array of `row` objects where
  //    * Keys are column names
  //    * Values are numbers or strings
  //  * `dataset.dimensionColumns` an array of `dimensionColumn` objects that 
  //    describe how columns in the dataset relate to dimensions.
  //    * `column` the column name (key in `row` objects)
  //    * `dimension` the name of the dimension
  //    * `codeList` the name of the code list used by `row` objects.
  //      For each `row` in `dataset.rows`, `row[column]` yields a string 
  //      that is a code from this code list.
  //  * `dataset.measureColumns` an array of `measureColumn` objects that 
  //    describe how columns in the dataset relate to measures.
  //    * `column` the column name (key in `row` objects)
  //    * `measure` the name of the measure
  //    * `scale` the scale factor used by values.
  //      For each `row` in `dataset.rows`, `row[column]` yields a number `x` 
  //      such that <br> `x * scale` yields the measure value.
  return function createCube (dataset) {
    var dimensionColumns = dataset.dimensionColumns,
        measureColumns = dataset.measureColumns;

    return {
      dimensions: _.pluck(dimensionColumns, 'dimension'),
      measures: _.pluck(measureColumns, 'measure'),
      observations: dataset.rows.map(function (row) {
        return createObservation(row, dimensionColumns, measureColumns);
      })
    };
  };
});
