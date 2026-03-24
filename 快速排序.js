/**
 * @param {number[]} arr
 * @return {number[]}
 */
var sortArray = function(arr, left = 0, right = arr.length - 1) {
  if (left >= right) return arr;

  const index = partition(arr, left, right);

  sortArray(arr, 0, index - 1)

  sortArray(arr, index + 1, right)

  return arr;
    
};

function partition(arr, left, right) {
  // 选择最右侧元素值为 i 准
  const base = arr[right];

  // 设置一个 边界下标，表示 小于基准的右边界
  let smallRight = left;

  // 循环遍历列表
  for (let i = left; i < arr.length; i++) {
    const v = arr[i];
    // 如果小于基准，则和边界元素互换
    if (v < base) {
      [arr[i], arr[smallRight]] = [arr[smallRight], arr[i]]
    // 边界下标++
      smallRight++;
    }
  }

  // 最后 交换 边界元素 和 基准元素
  [arr[smallRight], arr[right]] = [arr[right], arr[smallRight]]

  // 返回边界下标
  return smallRight
}