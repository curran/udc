
define('member',[], function () {
  var index = {};
  return function (dimension, codeList, code) {
    var dimensionIndex = index[dimension] || (index[dimension] = {}),
        codeListIndex = dimensionIndex[codeList] || (dimensionIndex[codeList] = {});
    return codeListIndex[code] || (codeListIndex[code] = Object.freeze({
      dimension: dimension,
      codeList: codeList,
      code: code,
      key: codeList + '|' + code
    }));
  };
});

define('cell',[], function () {
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

define('cube',['_', 'member', 'cell'], function (_, Member, Cell) {

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
        return Member(dimension, codeList, code);
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
      index[observation.cell.key] = observation.values;
    });

    return {
      values: function (cell) {
        return index[cell.key];
      }
    };
  };
});

define('Member',[], function () {
  var index = {};
  return function (dimension, codeList, code) {
    var dimensionIndex = index[dimension] || (index[dimension] = {}),
        codeListIndex = dimensionIndex[codeList] || (dimensionIndex[codeList] = {});
    return codeListIndex[code] || (codeListIndex[code] = Object.freeze({
      dimension: dimension,
      codeList: codeList,
      code: code,
      key: codeList + '|' + code
    }));
  };
});

define('Cell',[], function () {
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

define('thesaurus',['Member', 'Cell'], function (Member, Cell) {
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
              member = Member(dimension, codeList, code),
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

define('hierarchy',['member'], function (Member) {
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
        return { member: Member(dimension, codeList, node.code) };
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
          parents[child.member.key] = true;
        });
      }
      return newNode;
    }

    function getNewNode(member){
      return newNodes[member.key] || (newNodes[member.key] = {
        member: member
      });
    }

    function hasParent(node){
      return parents[node.member.key];
    }
  };
});

define('mergeCubes',['_', 'cubeIndex', 'Cell', 'Member'], function (_, CubeIndex, Cell, Member) {

  return function mergeCubes(cubeA, cubeB, thesaurus) {
    var a = thesaurus.canonicalizeCube(cubeA),
        b = thesaurus.canonicalizeCube(cubeB);
    return simpleMerge(a, b);
  };
  
  function simpleMerge(a, b){
    var dimensions = _.intersection(a.dimensions, b.dimensions),
        measures = _.union(a.measures, b.measures),
        indexA = CubeIndex(a.observations),
        indexB = CubeIndex(b.observations),

        // TODO cells = cartesian product of members for each dimension
        cells = _.pluck(a.observations, 'cell');
        
        observations = cells.map(function (cell) {
          var valuesA = indexA.values(cell),
              valuesB = indexB.values(cell);
          return {
            cell: cell,
            values: _.extend(valuesA, valuesB)
          };
        });
    
    return {
      dimensions: dimensions,
      measures: measures,
      observations: observations
    };
  }
});

define('udc',['member', 'cell', 'cube', 'cubeIndex', 'thesaurus', 'hierarchy', 'mergeHierarchies', 'mergeCubes'],
    function (Member, Cell, Cube, CubeIndex, Thesaurus, Hierarchy, mergeHierarchies, mergeCubes) {
  return {
    Member: Member,
    Cell: Cell,
    Cube: Cube,
    CubeIndex: CubeIndex,
    Thesaurus: Thesaurus,
    Hierarchy: Hierarchy,
    mergeHierarchies: mergeHierarchies,
    mergeCubes: mergeCubes
  };
});
