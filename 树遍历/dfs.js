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

function dfs(nodeList, result = []) {
  if (!nodeList) return result;
  for (const node of nodeList) {
    result.push(node);
    dfs(node.children, result);
  }
  return result;
}

console.log(dfs(tree))