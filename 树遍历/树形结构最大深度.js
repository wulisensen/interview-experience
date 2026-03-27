const data3 = [
  {
    id: 1,
    name: "前端",
    children: [
      {
        id: 2,
        name: "html",
        children: [
          { id: 5, name: "vue", children: [] },
          { id: 6, name: "react", children: [] },
        ],
      },
      { id: 3, name: "css", children: [{ id: 7, name: "c++", children: [] }] },
      { id: 4, name: "js", children: [{ id: 8, name: "java", children: [] }] },
    ],
  },
];

function maxDepth(tree) {
  let maxLevel = 0;

  function dfs(nodes, level) {
    for (const node of nodes) {
      maxLevel = Math.max(maxLevel, level);
      if (node.children) {
        dfs(node.children, level + 1)
      }
    }
  }

  dfs(tree, 1);

  return maxLevel;
}
 
const res = maxDepth(data3) // 3
console.log(res)