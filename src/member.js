// Implements the Member concept of the Universal Data Cube data model.
//
// # Member(dimension, codeList, code)
//
// A Member is a (dimension, codeList, code) tuple representing a member of a dimension hierarchy.
//
//  * dimension: String
//  * codeList: String
//  * code: String
//  * id: String - The unique key for this particular (dimension, codeList, code) tuple.

define([], function () {

  // index[dimension][codeList][code] == Member (dimension, codeList, code, key)
  var index = {},

      // An auto-incrementing integer id for generating Member keys. 
      idCounter = 0;

  return function (dimension, codeList, code) {
    var dimensionIndex = index[dimension] || (index[dimension] = {}),
        codeListIndex = dimensionIndex[codeList] || (dimensionIndex[codeList] = {});

    return codeListIndex[code] || (codeListIndex[code] = Object.freeze({
      dimension: dimension,
      codeList: codeList,
      code: code,
      // There is a single unique integer id for each
      // unique (dimension, codelist, code) pair that occurred in the data.
      id: String(idCounter++)
      // Store key as a String, because it will be used primarily
      // as a key for JavaScript objects, which must be a string.
    }));
  };
});
