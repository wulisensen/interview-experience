/**
 * @param {number[]} nums
 * @param {number} k
 * @return {number}
 */
var findKthLargest = function(nums, k) {
  function quickSelect(left, right, k) {
    const base = nums[right];
    let p = left;
    for (let i = left; i < right; i++) {
      if (nums[i] > base) {
        [nums[p], nums[i]] = [nums[i], nums[p]];
        p ++;
      }
    }
    [nums[p], nums[right]] = [nums[right], nums[p]];
    const rank = p - left + 1;
    if (rank === k) {
      return nums[p];
    } else if (rank > k) {
      return quickSelect(left, p - 1, k);
    } else {
      return quickSelect(p + 1, right, k - rank)
    }
  }

  return quickSelect(0, nums.length - 1, k);
};