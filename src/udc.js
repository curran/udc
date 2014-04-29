define(['member', 'cell', 'cube', 'cubeIndex', 'concordance', 'hierarchy', 'mergeCubes'],
    function (Member, Cell, Cube, CubeIndex, Concordance, Hierarchy, mergeCubes) {
  return {
    Member: Member,
    Cell: Cell,
    Cube: Cube,
    CubeIndex: CubeIndex,
    Concordance: Concordance,
    Hierarchy: Hierarchy,
    mergeCubes: mergeCubes
  };
});
