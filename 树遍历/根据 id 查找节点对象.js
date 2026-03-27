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

function findNode(tree, id) {

  function dfs(nodes) {
    for (const node of nodes) {
      if (node.id === id) {
        return node;
      } else if (node.children) {
        const res = dfs(node.children)
        if (res) {
          return res;
        }
      }
    }
  }

  return dfs(tree);
}

const res = findNode(data3, 6) // { id:6, name:'react' }
console.log(res)