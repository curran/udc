define(['member', 'cell', 'cube', 'cubeIndex', 'concordance', 'mergeCubes'],
    function (Member, Cell, Cube, CubeIndex, Concordance, mergeCubes) {
  return {
    Member: Member,
    Cell: Cell,
    Cube: Cube,
    CubeIndex: CubeIndex,
    Concordance: Concordance,
    mergeCubes: mergeCubes
  };
});
