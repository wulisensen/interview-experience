/**
 * 找数组中第 K 个最大元素（快速选择法）
 * @param {number[]} nums - 未排序数组
 * @param {number} k - 第 K 大（k ≥ 1）
 * @return {number} - 第 K 个最大元素
 */
var findKthLargest = function(nums, k) {
    // 快速选择核心函数：在 [left, right] 范围内找第 k 大元素
    const quickSelect = (left, right, k) => {
        // 基准值：选右边界（也可选随机值，避免最坏情况）
        const pivot = nums[right];
        let p = left; // 小于 pivot 的区域指针

        // 分区：将大于 pivot 的元素移到左侧
        for (let i = left; i < right; i++) {
            if (nums[i] > pivot) {
                [nums[p], nums[i]] = [nums[i], nums[p]]; // 交换
                p++;
            }
        }
        // 将 pivot 放到正确位置（p 位置）
        [nums[p], nums[right]] = [nums[right], nums[p]];

        // 判断 pivot 是否是第 k 大元素
        const pivotRank = p - left + 1; // 当前 pivot 在 [left, right] 中的排名（第几个大）
        if (pivotRank === k) {
            return nums[p]; // 找到目标
        } else if (pivotRank > k) {
            // 目标在左半部分（大于 pivot 的区域）
            return quickSelect(left, p - 1, k);
        } else {
            // 目标在右半部分（小于等于 pivot 的区域），k 需减去左半部分长度
            return quickSelect(p + 1, right, k - pivotRank);
        }
    };

    // 初始调用：整个数组范围，找第 k 大
    return quickSelect(0, nums.length - 1, k);
};

// 测试用例
console.log(findKthLargest([3,2,1,5,6,4], 2)); // 5
console.log(findKthLargest([3,2,3,1,2,4,5,5,6], 4)); // 4
console.log(findKthLargest([1], 1)); // 1