define([], function () {
  var index = {},
      id = 0;
  return function (dimension, codeList, code) {
    var dimensionIndex = index[dimension] || (index[dimension] = {}),
        codeListIndex = dimensionIndex[codeList] || (dimensionIndex[codeList] = {});
    return codeListIndex[code] || (codeListIndex[code] = Object.freeze({
      dimension: dimension,
      codeList: codeList,
      code: code,
      key: id++//codeList + '|' + code
    }));
  };
});
