// # getMember(dimension, codelist, code)
//
// Implements the Member concept of the Universal Data Cube data model.
//
// Members are nodes in Dimension hierarchies.
//
// Gets (or creates if necessary) the Member object corresponding to
// the given (dimension, codelist, code) tuple.
//
// Member objects contain:
//
//  * dimension: String - A Dimension name
//  * codelist: String - A Codelist name
//  * code: String - A Code within the codelist
//  * id: String - The unique key for this particular (dimension, codelist, code) tuple.
define([], function () {

  /* index[dimension][codeList][code] == Member (dimension, codeList, code, key) */
  var index = {},

      /* An auto-incrementing integer id counter */
      idCounter = 0;

  return function (dimension, codeList, code) {

    /* Get or create the index bucket for the Member object. */
    var dimensionIndex = index[dimension] || (index[dimension] = {}),
        codeListIndex = dimensionIndex[codeList] || (dimensionIndex[codeList] = {});

    /* Get or create the Member object */
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
