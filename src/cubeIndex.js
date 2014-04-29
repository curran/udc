define([], function () {

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
