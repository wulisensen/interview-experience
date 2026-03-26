// 验证是否是回文字符串
function check(s) {
  if (s.length <= 1) return true;
  if (s[0] !== s[s.length - 1]) return false;
  return s[1, -1];
}

function getMaxSubString(s) {
  let maxString = '';
  for (let i = 0; i < s.length; i++) {
    for (let j = i; j < s.length; j++) {
      const subString = s.slice(i, j);
      if (check(subString) && subString.length >= maxString) {
        maxString = subString
      }
    }
  }
  return maxString;
}