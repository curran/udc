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
          parents[child.member.id] = true;
        });
      }
      return newNode;
    }

    function getNewNode(member){
      return newNodes[member.id] || (newNodes[member.id] = {
        member: member
      });
    }

    function hasParent(node){
      return parents[node.member.id];
    }
  };
});
