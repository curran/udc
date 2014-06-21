define(['getMember'], function (getMember) {
  return function (tree) {
    var dimension = tree.dimension,
        codeList = tree.codeList;
  
    function transformTree(node, transformNode){
      var newNode = transformNode(node);
      if(node.children) {
        newNode.children = node.children.map(function (child) {
          return transformTree(child, transformNode);
        });
      }
      return newNode;
    }

    return {
      dimension: dimension,
      tree: transformTree(tree, function (node) {
        return { member: getMember(dimension, codeList, node.code) };
      }),
    };
  };
});
