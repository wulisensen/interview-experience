const tree = [{ id:1, children: [{ id:2 }, { id:3 }] }]
// 输出：[{id:1},{id:2},{id:3}]

function treeToArray(tree) {
  const result = [];

  function dfs(nodes) {

    for (const node of nodes) {
        result.push(node)
        if (node.children) {
          dfs(node.children)
        }
    }
  }
  dfs(tree);

  return result;

}

console.log(treeToArray(tree))