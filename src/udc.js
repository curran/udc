define(['member', 'cell', 'cube', 'cubeIndex', 'thesaurus', 'hierarchy', 'mergeHierarchies', 'mergeCubes'],
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
