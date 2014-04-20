define([], function () {
  return function (table) {
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
});
