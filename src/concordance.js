define(['Member'], function (Member) {
  return function Concordance (table) {
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
        var dimension = dimensionColumn.dimension,
            codeList = dimensionColumn.codeList,
            code = row[dimensionColumn.column]
            member = Member(dimension, codeList, code);
        equivalenceClass[codeList] = member;
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
});
