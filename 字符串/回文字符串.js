function isPalindrome(s) {
  if (s <= 1) return true;
  let left = 0;
  let right = s.length - 1;
  while (left <= right) {
    if (s[left] === s[right]) {
      left ++;
      right --;
    } else {
      return false
    }
  }
  return true;
}