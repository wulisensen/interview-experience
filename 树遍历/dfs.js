const tree = [
  { id: 1, name: '前端', children: [
    { id: 2, name: 'html', children: [
      { id: 5, name: 'vue' },
      { id: 6, name: 'react' }
    ]},
    { id: 3, name: 'css', children: [
      { id: 7, name: 'c++' }
    ]}
  ]}
];

// DFS 递归
function dfs(nodeList, result = []) {
  if (!nodeList) return result;
  for (let node of nodeList) {
    result.push(node.name);         // 存当前节点
    dfs(node.children, result);     // 递归子节点
  }
  return result;
}

console.log(dfs(tree))
// 输出：['前端','html','vue','react','css','c++']