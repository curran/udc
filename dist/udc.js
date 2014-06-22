
// # getMember(dimension, codelist, code)
//
// Implements the Member concept of the Universal Data Cube data structure.
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
define('getMember',[], function () {

  /* index[dimension][codeList][code] == Member (dimension, codeList, code, key) */
  var index = {},

      /* An auto-incrementing integer id counter */
      idCounter = 0;

  return function getMember(dimension, codeList, code) {

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
define('getCell',['_'], function () {

  // index[memberId][memberId][memberId] ...
  var index = {},
      
      /* An auto-incrementing integer id counter */
      idCounter = 0;

  return function getCell(members) {

    // Normalize the given `members` array such that order doesn't matter
    // by sorting alphabetically by the dimension names of the members.
    var sortedMembers = _.sortBy(members, 'dimension'),
        
        // Get or create the index bucket for the Cell object.
        cellIndex = sortedMembers.reduce(function (subIndex, member) {
          return subIndex[member.id] || (subIndex[member.id] = {});
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

define('createObservation',['getMember', 'getCell'], function (getMember, getCell) {
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

define('createCube',['_', 'createObservation'], function (_, createObservation) {

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

define('cubeIndex',[], function () {

  return function CubeIndex(observations) {
    var index = {};

    observations.forEach(function (observation) {
      index[observation.cell.id] = observation.values;
    });

    return {
      values: function (cell) {
        return index[cell.id];
      }
    };
  };
});

// Implements the Thesaurus concept of the Universal Data Cube data structure.
//
// The purpose of a Thesaurus is to canonicalize Cubes so they can be merged.
define('thesaurus',['getMember', 'getCell'], function (getMember, getCell) {

  // A Thesaurus is constructed from many datasets.
  return function Thesaurus (datasets) {
    
    // index[dimension][codelist][code] = equivalenceClass
    // equivalenceClass[codelist] = Member
    var index = {},

        // canonicalCodelists[dimension] = codelist
        canonicalCodelists = {};

    // Build the index.
    datasets.forEach(function (dataset) {

      // For each row of the dataset,
      dataset.rows.forEach(function (row) {

        // construct an equivalence class of Members.
        // equivalenceClass[codelist] = Member
        var equivalenceClass = {};

        // For each dimensionColumn,
        dataset.dimensionColumns.forEach(function (d) {

          // get the Member represented by the current row,
          var dimension = d.dimension,
              codelist = d.codeList,
              code = row[d.column],
              member = getMember(dimension, codelist, code),

              // Get or create the index bucket for the Member object.
              dimensionIndex = index[dimension] || (index[dimension] = {}),
              codelistIndex = dimensionIndex[codelist] || (dimensionIndex[codelist] = {});

          // Add the Member to the equivalence class.
          equivalenceClass[codelist] = member;

          // Add the equivalence class to the Thesaurus index.
          codelistIndex[code] = equivalenceClass;

        });
      });
    });

    // Derive canonical code lists for each dimension.
    var dimensions = Object.keys(index);
    dimensions.forEach(function (dimension) {
      var codelists = Object.keys(index[dimension]);
      canonicalCodelists[dimension] = codelists.sort()[0];
    });

    // Translates the given member to the given code list.
    function translate(member, codelist){
      return index[member.dimension][member.codeList][member.code][codelist];
    }

    // Translates the given member to the canonical code list for its dimension.
    function canonicalizeMember(member){
      var dimensionIndex = index[member.dimension],
          codelistIndex,
          codelist;
      if(dimensionIndex) {
        codelistIndex = dimensionIndex[member.codeList];
        if(codelistIndex.hasOwnProperty(member.code)) {
          codelist = canonicalCodelists[member.dimension];
          return codelistIndex[member.code][codelist];

          // TODO find a case where this is necessary
          //var equivalenceClass = codelistIndex[member.code],
          //    codelists = canonicalCodelists[member.dimension],
          //    codelist,
          //    i;
          //console.log(equivalenceClass);
          //for(i = 0; i < codelists.length; i++) {
          //  codelist = codelists[i];
          //  if(equivalenceClass.hasOwnProperty(codelist)) {
          //    return equivalenceClass[codelist];
          //  }
          //}
        }
      }
      return member;
    }

    // Translates the members of the given cell to the canonical code lists
    // for their respective dimensions.
    function canonicalizeCell(cell){
      return getCell(cell.members.map(canonicalizeMember));
    }

    // Translates the members of the cell of the given observation
    // to the canonical code lists for their respective dimensions.
    function canonicalizeObservation(observation){
      return {
        cell: canonicalizeCell(observation.cell),
        values: observation.values
      };
    }

    // Translates the members of the cells of the observations in the
    // given cube to the canonical code lists for their respective dimensions.
    function canonicalizeCube(cube){
      return {
        dimensions: cube.dimensions,
        measures: cube.measures,
        observations: cube.observations.map(canonicalizeObservation)
      }; 
    }

    return {
      translate: translate,
      canonicalizeMember: canonicalizeMember,
      canonicalizeCell: canonicalizeCell,
      //canonicalizeObservation: canonicalizeObservation,
      canonicalizeCube: canonicalizeCube
    };
  };
});

define('hierarchy',['getMember'], function (getMember) {
  return function (tree) {
    var dimension = tree.dimension,
        codeList = tree.codeList;
  
    function transformTree(node, transformNode){
      var newNode = transformNode(node);
      if(node.children) {
        newNode.children = node.children.map(function (child) {
          return transformTree(child, transformNode);
        });
      }
      return newNode;
    }

    return {
      dimension: dimension,
      tree: transformTree(tree, function (node) {
        return { member: getMember(dimension, codeList, node.code) };
      }),
    };
  };
});

define('mergeHierarchies',[], function () {
  return function (hierarchyA, hierarchyB, thesaurus) {
    var newNodes = {},
        parents = {},
        treeB = indexNodes(hierarchyB.tree),
        treeA = indexNodes(hierarchyA.tree);

    return {
      dimension: hierarchyA.dimension,
      tree: hasParent(treeA) ? treeB : treeA
    };

    function indexNodes(node) {
      var member = thesaurus.canonicalizeMember(node.member),
          newNode = getNewNode(member);
      if(node.children){
        newNode.children = (newNode.children || []);
        newNode.children = newNode.children.concat(node.children.map(indexNodes));
        node.children.forEach(function (child) {
          parents[child.member.id] = true;
        });
      }
      return newNode;
    }

    function getNewNode(member){
      return newNodes[member.id] || (newNodes[member.id] = {
        member: member
      });
    }

    function hasParent(node){
      return parents[node.member.id];
    }
  };
});

define('mergeCubes',['_', 'cubeIndex'], function (_, CubeIndex) {

  // Canonicalizes and merges two cubes.
  //
  // TODO separate canonicalization and merging completely
  return function mergeCubes(cubeA, cubeB, thesaurus) {
    var a = thesaurus.canonicalizeCube(cubeA),
        b = thesaurus.canonicalizeCube(cubeB);
    return simpleMerge(a, b);
  };
  
  // Merges two canonicalized cubes.
  function simpleMerge(a, b){
    var dimensions = _.intersection(a.dimensions, b.dimensions),
        measures = _.union(a.measures, b.measures),
        indexA = CubeIndex(a.observations),
        indexB = CubeIndex(b.observations),

        // TODO cells = join of members for each dimension
        // TODO add unit tests for the join
        //
        // Options:
        //
        //  * Inner Join
        //    * requires observations in both cubes with matching cells
        //    * produces integrated cubes with no missing values
        //    * may exclude data
        //  * Outer Join - Produces integrated cubes with missing data
        //    * requires observations with equivalent cells in one cube or the other, or both
        //    * produces integrated cubes with missing values
        //    * includes all original data
        //
        // Currently the implementation just uses all the cells present in a's observations.
        cells = _.pluck(a.observations, 'cell');
        
        // Combine values from every pair of observations
        observations = cells.map(function (cell) {
          var valuesA = indexA.values(cell),
              valuesB = indexB.values(cell);
          // TODO create a module for Observations
          return {
            cell: cell,
            // TODO take average of measures found in both
            // TODO think about tracking difference values
            values: _.extend(valuesA, valuesB)
          };
        });
    
    // TODO create a module for Cubes
    return {
      dimensions: dimensions,
      measures: measures,
      observations: observations
    };
  }
});

define('slice',['getCell', '_'], function (getCell, _) {
  return function (cube, member) {
    return {
      dimensions: cube.dimensions.filter(function (dimension) {
        return dimension !== member.dimension;
      }),
      measures: cube.measures,

      // Only include the Observations whose cells contain the member to slice by.
      observations: cube.observations.filter(function (observation) {
        return _.contains(observation.cell.members, member);

        //return observation.cell.membersByDimension[member.dimension].id === member.id;
      }).map(function (observation) {
        return {
          cell: getCell(observation.cell.members.filter(function (cellMember) {
            return cellMember.dimension !== member.dimension;
          })),
          values: observation.values
        };
      })
    };
  };
});

define('udc',['getMember', 'getCell', 'createCube', 'cubeIndex', 'thesaurus', 'hierarchy', 'mergeHierarchies', 'mergeCubes', 'slice'],
    function (getMember, getCell, createCube, CubeIndex, Thesaurus, Hierarchy, mergeHierarchies, mergeCubes, slice) {
  return {
    getMember: getMember,
    getCell: getCell,
    createCube: createCube,
    createCubeIndex: CubeIndex,
    createThesaurus: Thesaurus,
    mergeCubes: mergeCubes,
    slice: slice,

    Hierarchy: Hierarchy,
    mergeHierarchies: mergeHierarchies,
  };
});
