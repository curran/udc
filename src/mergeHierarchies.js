define([], function () {
  return function (hierarchyA, hierarchyB, thesaurus) {
    var newNodes = {},
        parents = {},
        treeB = indexNodes(hierarchyB.tree),
        treeA = indexNodes(hierarchyA.tree);

    return {
      dimension: hierarchyA.dimension,
      tree: hasParent(treeA) ? treeB : treeA
    };

    function indexNodes(node) {
      var member = thesaurus.canonicalizeMember(node.member),
          newNode = getNewNode(member);
      if(node.children){
        newNode.children = (newNode.children || []);
        newNode.children = newNode.children.concat(node.children.map(indexNodes));
        node.children.forEach(function (child) {
          parents[child.member.key] = true;
        });
      }
      return newNode;
    }

    function getNewNode(member){
      return newNodes[member.key] || (newNodes[member.key] = {
        member: member
      });
    }

    function hasParent(node){
      return parents[node.member.key];
    }
  };
});
