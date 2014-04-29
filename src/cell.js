define([], function () {
  var index = {};
  return function (members) {
    var cellIndex = members.sort(byDimension).reduce(function (subIndex, member) {
      var dimensionIndex = subIndex[member.dimension] || (subIndex[member.dimension] = {}),
          codeListIndex = dimensionIndex[member.codeList] || (dimensionIndex[member.codeList] = {});
      return codeListIndex[member.code] || (codeListIndex[member.code] = {});
    }, index);
    return cellIndex.cell || (cellIndex.cell = createCell(members));
  };
  function byDimension(a, b) {
    return a.dimension > b.dimension ? 1 : -1;
  }
  function createCell(members){
    //var membersByDimension = {};

    //members.forEach(function (member) {
    //  membersByDimension[member.dimension] = member;
    //});

    return Object.freeze({
      members: members,
      //membersByDimension: membersByDimension,
      key: members.map(function (d) { return d.key; }).join('~')
    });
  }
});
