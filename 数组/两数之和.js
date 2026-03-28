/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
var twoSum = function(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const item = nums[i];
    if (map.has(target - item)) {
      return [
        map.get(target - item),
        i,
      ]
    }
    map.set(item, i)
  }
}

const res = twoSum([2,7,11,15], 9)
console.log(res)

// https://leetcode.cn/problems/two-sum/description/?envType=study-plan-v2&envId=top-100-liked