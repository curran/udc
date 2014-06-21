define(['getCell', '_'], function (getCell, _) {
  return function (cube, member) {
    return {
      dimensions: cube.dimensions.filter(function (dimension) {
        return dimension !== member.dimension;
      }),
      measures: cube.measures,

      // Only include the Observations whose cells contain the member to slice by.
      observations: cube.observations.filter(function (observation) {
        return _.contains(observation.cell.members, member);

        //return observation.cell.membersByDimension[member.dimension].id === member.id;
      }).map(function (observation) {
        return {
          cell: getCell(observation.cell.members.filter(function (cellMember) {
            return cellMember.dimension !== member.dimension;
          })),
          values: observation.values
        };
      })
    };
  };
});
