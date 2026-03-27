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
function bfs(nodeList) {
  if (!nodeList) return;
  const result = [];
  const queue = [...nodeList];   // 队列
  
  while (queue.length) {
    const node = queue.shift();   // 取队首
    result.push(node);
    // 子节点入队
    if (node.children) {
      queue.push(...node.children)  
    }
  }
  return result;
}

console.log(bfs(tree))
// 输出：['前端','html','css','vue','react','c++']