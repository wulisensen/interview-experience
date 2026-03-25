/**
 * 快速排序（基础版，选最右元素为基准）
 * @param {number[]} arr - 待排序数组
 * @param {number} left - 排序区间左边界（默认0）
 * @param {number} right - 排序区间右边界（默认数组最后一位索引）
 * @return {number[]} - 排序后的数组
 */
function quickSort(arr, left = 0, right = arr.length - 1) {
    // 递归终止条件：子数组长度 ≤ 1
    if (left >= right) return arr;

    // 1. 分区操作：返回基准元素的最终索引
    const pivotIndex = partition(arr, left, right);

    // 2. 递归处理基准左侧子数组
    quickSort(arr, left, pivotIndex - 1);
    // 3. 递归处理基准右侧子数组
    quickSort(arr, pivotIndex + 1, right);

    return arr;
}

/**
 * 分区函数：将数组分为「小于基准」和「大于基准」两部分
 * @param {number[]} arr - 待分区数组
 * @param {number} left - 分区左边界
 * @param {number} right - 分区右边界（基准元素索引）
 * @return {number} - 基准元素的最终索引
 */
function partition(arr, left, right) {
    // 选最右元素作为基准
    const pivot = arr[right];
    // p 是「小于基准区域」的右边界指针（初始为左边界）
    let p = left;

    // 遍历 [left, right-1] 区间，完成分区
    for (let i = left; i < right; i++) {
        // 若当前元素小于基准，交换到「小于基准区域」的右侧
        if (arr[i] < pivot) {
            [arr[p], arr[i]] = [arr[i], arr[p]]; // ES6 解构交换
            p++; // 扩大「小于基准区域」
        }
    }

    // 将基准元素放到最终位置（p 位置）
    [arr[p], arr[right]] = [arr[right], arr[p]];

    // 返回基准索引，供递归使用
    return p;
}

// 测试用例
const arr1 = [3, 2, 1, 5, 6, 4];
console.log(quickSort([...arr1])); // [1, 2, 3, 4, 5, 6]

const arr2 = [3, 2, 3, 1, 2, 4, 5, 5, 6];
console.log(quickSort([...arr2])); // [1, 2, 2, 3, 3, 4, 5, 5, 6]

const arr3 = [1];
console.log(quickSort(arr3)); // [1]

const arr4 = [];
console.log(quickSort(arr4)); // []