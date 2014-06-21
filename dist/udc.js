
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
define('getMember',[], function () {

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

define('cell',[], function () {
  var index = {},
      idCounter = 0;
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
    var membersByDimension = {};

    members.forEach(function (member) {
      membersByDimension[member.dimension] = member;
    });

    return Object.freeze({
      members: members,
      membersByDimension: membersByDimension,
      id: String(idCounter++)//members.map(function (d) { return d.key; }).join('~')
    });
  }
});

define('cube',['_', 'getMember', 'cell'], function (_, getMember, Cell) {

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
  return function Cube (table) {
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

  function Observation(row, dimensionColumns, measureColumns) {
    var observation = {
      cell: Cell(dimensionColumns.map(function (dimensionColumn) {
        var dimension = dimensionColumn.dimension,
            codeList = dimensionColumn.codeList,
            code = row[dimensionColumn.column];
        return getMember(dimension, codeList, code);
      })),
      values: {}
    };

    measureColumns.forEach(function (d) {
      observation.values[d.measure] = row[d.column] * d.scale;
    });

    return observation;
  }
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

define('thesaurus',['getMember', 'cell'], function (getMember, Cell) {
  return function Thesaurus (tables) {

    
    var index = {},
        canonicalCodeLists = {};

    // Build the index.
    tables.forEach(function (table) {
      table.rows.forEach(function (row) {
        var equivalenceClass = {};
        table.dimensionColumns.forEach(function (dimensionColumn) {
          var dimension = dimensionColumn.dimension,
              codeList = dimensionColumn.codeList,
              code = row[dimensionColumn.column],
              member = getMember(dimension, codeList, code),
              dimensionIndex = index[dimension] || (index[dimension] = {}),
              codeListIndex = dimensionIndex[codeList] || (dimensionIndex[codeList] = {});
          equivalenceClass[codeList] = member;
          codeListIndex[code] = equivalenceClass;
        });
      });
    });

    // Derive canonical code lists.
    Object.keys(index).forEach(function (dimension) {
      canonicalCodeLists[dimension] = Object.keys(index[dimension]).sort();
    });

    // Translates the given member to the given code list.
    function translate(member, codeList){
      return index[member.dimension][member.codeList][member.code][codeList];
    }

    // Translates the given member to the canonical code list for its dimension.
    function canonicalizeMember(member){
      var dimensionIndex = index[member.dimension],
          codeListIndex,
          codeList;
      if(dimensionIndex) {
        codeListIndex = dimensionIndex[member.codeList];
        if(codeListIndex.hasOwnProperty(member.code)) {
          codeList = canonicalCodeLists[member.dimension][0];
          return codeListIndex[member.code][codeList];

          // TODO find a case where this is necessary
          //var equivalenceClass = codeListIndex[member.code],
          //    codeLists = canonicalCodeLists[member.dimension],
          //    codeList,
          //    i;
          //console.log(equivalenceClass);
          //for(i = 0; i < codeLists.length; i++) {
          //  codeList = codeLists[i];
          //  if(equivalenceClass.hasOwnProperty(codeList)) {
          //    return equivalenceClass[codeList];
          //  }
          //}
        }
      }
      return member;
    }

    // Translates the members of the given cell to the canonical code lists
    // for their respective dimensions.
    function canonicalizeCell(cell){
      return Cell(cell.members.map(canonicalizeMember));
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

define('mergeCubes',['_', 'cubeIndex', 'cell'], function (_, CubeIndex, Cell) {

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

define('slice',['cell'], function (Cell) {
  return function (cube, member) {
    return {
      dimensions: cube.dimensions.filter(function (dimension) {
        return dimension !== member.dimension;
      }),
      measures: cube.measures,
      observations: cube.observations.filter(function (observation) {
        return observation.cell.membersByDimension[member.dimension].id === member.id;
      }).map(function (observation) {
        return {
          cell: Cell(observation.cell.members.filter(function (cellMember) {
            return cellMember.dimension !== member.dimension;
          })),
          values: observation.values
        };
      })
    };
  };
});

define('udc',['getMember', 'cell', 'cube', 'cubeIndex', 'thesaurus', 'hierarchy', 'mergeHierarchies', 'mergeCubes', 'slice'],
    function (getMember, Cell, Cube, CubeIndex, Thesaurus, Hierarchy, mergeHierarchies, mergeCubes, slice) {
  return {
    getMember: getMember,
    getCell: Cell,
    createCube: Cube,
    createCubeIndex: CubeIndex,
    createThesaurus: Thesaurus,
    mergeCubes: mergeCubes,
    slice: slice,

    Hierarchy: Hierarchy,
    mergeHierarchies: mergeHierarchies,
  };
});
