/**
 * 查找无重复字符的最长子串的长度
 * @param {string} s - 输入字符串
 * @return {number} - 最长无重复子串的长度
 */
var lengthOfLongestSubstring = function(s) {
    // 1. 哈希表：存储字符 -> 最新索引，快速判断重复
    const charIndexMap = new Map();
    // 2. 左指针（窗口左边界），初始为0
    let left = 0;
    // 3. 记录最长子串长度，初始为0
    let maxLength = 0;

    // 4. 右指针（窗口右边界）遍历字符串
    for (let right = 0; right < s.length; right++) {
        const currentChar = s[right];
        
        // 5. 关键：若当前字符在窗口内重复，移动左指针到重复字符的下一位
        if (charIndexMap.has(currentChar) && charIndexMap.get(currentChar) >= left) {
            left = charIndexMap.get(currentChar) + 1;
        }

        // 6. 更新当前字符的最新索引
        charIndexMap.set(currentChar, right);

        // 7. 计算当前窗口长度，更新最大值
        const currentLength = right - left + 1;
        maxLength = Math.max(maxLength, currentLength);
    }

    return maxLength;
};

// 测试用例
console.log(lengthOfLongestSubstring("abcabcbb")); // 3（"abc"）
console.log(lengthOfLongestSubstring("bbbbb"));    // 1（"b"）
console.log(lengthOfLongestSubstring("pwwkew"));   // 3（"wke" 或 "kew"）
console.log(lengthOfLongestSubstring(""));         // 0（空字符串）
console.log(lengthOfLongestSubstring("au"));       // 2（"au"）
console.log(lengthOfLongestSubstring("abba"));     // 2（"ab" 或 "ba"）