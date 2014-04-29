define([], function () {
  // TODO canonicalize hierarchy
  // TODO refactor canonicalization code
  // TODO change concordance to concordance collection
  //      possible terms: 
  //        Concordance
  //        ConcorcanceCollection
  //        DataDictionary
  //        MemberDictionary
  //        EquivalenceIndex
  //        Matches
  return function (hierarchyA, hierarchyB, concordance) {
    var newNodes = {},
        parents = {},
        rootB = indexNodes(hierarchyB.tree),
        rootA = indexNodes(hierarchyA.tree);

    return hasParent(rootA) ? rootB : rootA;

    function indexNodes(node) {
      var newNode = getNewNode(node.member);
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
  }
});
