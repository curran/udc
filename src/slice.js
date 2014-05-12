define(['cell'], function (Cell) {
  return function (cube, member) {
    return {
      dimensions: cube.dimensions.filter(function (dimension) {
        return dimension !== member.dimension;
      }),
      measures: cube.measures,
      observations: cube.observations.filter(function (observation) {
        return observation.cell.membersByDimension[member.dimension].key === member.key;
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
