define(['getMember', 'getCell', 'createCube', 'cubeIndex', 'thesaurus', 'hierarchy', 'mergeHierarchies', 'mergeCubes', 'slice'],
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
