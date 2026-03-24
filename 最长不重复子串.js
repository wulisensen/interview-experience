/**
 * @param {string} s
 * @return {number}
 */
var lengthOfLongestSubstring = function(s) {
    if (s.length <= 1) return s.length;
    const cache = new Map();
    let maxStrLen = 0;
    let left = 0;
    for (let right = 0; right < s.length; right++) {
      const current = s[right];
      if (cache.has(current) && cache.get(current) >= left) {
        left = cache.get(current) + 1;
      }
      cache.set(current, right)
      const subStringLen = right - left + 1;
      maxStrLen = Math.max(maxStrLen, subStringLen);
    }
    return maxStrLen;
};