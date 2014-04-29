define(['member'], function (Member) {
  return function (tree) {
    var dimension = tree.dimension,
        codeList = tree.codeList;
  
    function extractMembers(node){
      var newNode = {
        member: Member(dimension, codeList, node.code)
      };
      if(node.children) {
        newNode.children = node.children.map(extractMembers);
      }
      return newNode;
    }

    return {
      dimension: dimension,
      tree: extractMembers(tree, codeList)
    };
  };
});
