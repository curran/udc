define(['member', 'cell', 'cube', 'cubeIndex', 'concordance', 'hierarchy', 'mergeHierarchies', 'mergeCubes'],
    function (Member, Cell, Cube, CubeIndex, Concordance, Hierarchy, mergeHierarchies, mergeCubes) {
  return {
    Member: Member,
    Cell: Cell,
    Cube: Cube,
    CubeIndex: CubeIndex,
    Concordance: Concordance,
    Hierarchy: Hierarchy,
    mergeHierarchies: mergeHierarchies,
    mergeCubes: mergeCubes
  };
});
