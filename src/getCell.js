// # getCell(members)
//
// Implements the Cell concept of the Universal Data Cube data structure.
//
// Cells are unique sets of Member objects. They are used to define the
// domain of Observations, which assign Measure values to Cells.
//
// Cell objects contain:
//
//  * members: [Member] - an array of Member objects, sorted by dimension name
//  * id: String - The unique key for this particular set of Members.
define(['_'], function () {

  // index[dimension][codelist][code][dimension][codelist][code] ...
  var index = {},

      idCounter = 0;

  return function getCell(members) {

    // Normalize the given `members` array such that order doesn't matter
    // by sorting alphabetically by the dimension names of the members.
    var sortedMembers = _.sortBy(members, 'dimension'),
        
        // Get or create the index bucket for the Cell object.
        cellIndex = sortedMembers.reduce(function (subIndex, member) {
          var dimensionIndex = subIndex[member.dimension] || (subIndex[member.dimension] = {}),
              codeListIndex = dimensionIndex[member.codeList] || (dimensionIndex[member.codeList] = {});
          return codeListIndex[member.code] || (codeListIndex[member.code] = {});
        }, index);

    // Get or create the Cell object
    return cellIndex.cell || (cellIndex.cell = Object.freeze({
      members: sortedMembers,
      // There is a single unique Cell id for each unique set of Members.
      id: String(idCounter++)
    }));
  };

  /*
 
    It may improve performance of the slice operation
    to index members by dimension, however this will 
    make Cell objects occupy more memory.

    var membersByDimension = {};

    members.forEach(function (member) {
      membersByDimension[member.dimension] = member;
    });
  */
});
