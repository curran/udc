define([], function () {

  return function CubeIndex(observations) {
    var index = {};

    observations.forEach( function (observation) {
      index[key(observation.cell)] = observation.values;
    });

    return {
      values: function (cell) {
        return index[key(cell)];
      }
    };
  };

  function key(cell){
    return Object.keys(cell).sort().map(function (dimension) {
      var member = cell[dimension];
      return member.codeList + '|' + member.code;
    }).join(',');
  }
});
