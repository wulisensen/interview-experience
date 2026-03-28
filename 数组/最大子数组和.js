function maxSubArray(nums) {
  let maxSum = nums[0]
  let curSum = nums[0]

  for (let i = 1; i < nums.length; i++) {
    // 核心：前面是负的，就从当前数重新开始
    curSum = Math.max(nums[i], curSum + nums[i])
    // 更新最大
    maxSum = Math.max(maxSum, curSum)
  }

  return maxSum
}

const res = maxSubArray([-2,1,-3,4,-1,2,1,-5,4])
console.log(res)

// https://www.youtube.com/watch?v=g-XcfPbLwQ8