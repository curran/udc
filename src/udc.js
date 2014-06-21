define(['getMember', 'cell', 'cube', 'cubeIndex', 'thesaurus', 'hierarchy', 'mergeHierarchies', 'mergeCubes', 'slice'],
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
