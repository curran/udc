define(['getMember', 'getCell', 'cube', 'cubeIndex', 'thesaurus', 'hierarchy', 'mergeHierarchies', 'mergeCubes', 'slice'],
    function (getMember, getCell, Cube, CubeIndex, Thesaurus, Hierarchy, mergeHierarchies, mergeCubes, slice) {
  return {
    getMember: getMember,
    getCell: getCell,
    createCube: Cube,
    createCubeIndex: CubeIndex,
    createThesaurus: Thesaurus,
    mergeCubes: mergeCubes,
    slice: slice,

    Hierarchy: Hierarchy,
    mergeHierarchies: mergeHierarchies,
  };
});
