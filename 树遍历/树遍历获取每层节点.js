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
const getAllNodeNames = (tree,  id) => {
  const path = [];

  function dfs(_tree) {
    path.push(tree.name)
    for (const node of _tree) {
      if (node.id === id) {
        return true;
      } else if (_tree.children && dfs(_tree.children)) {
        return false
      } else {
        path.pop();
      }
    }
    return false;
  }

  dfs(tree);

  return path;
}
getAllNodeNames(data3, 7)
//输出  ["前端", "css", "c++"]