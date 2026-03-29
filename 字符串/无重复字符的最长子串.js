function lengthOfLongestSubstring(s) {
  const map = new Map();
  let left = 0;
  let maxLength = 0;

  for (let right = 0; right < s.length; right++) {
    const sub = s[right];
    if (map.has(sub)) {
      left  = right;
    }
    maxLength = Math.max(maxLength, right - left + 1)
    map.set(sub, right);
  }

  return maxLength;
}