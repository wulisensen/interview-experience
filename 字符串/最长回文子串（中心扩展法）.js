function longestPalindrome(s) {
  let res = ''

  function expand(l, r) {
    while (l >= 0 && r < s.length && s[l] === s[r]) {
      l--
      r++
    }
    return s.slice(l + 1, r)
  }

  for (let i = 0; i < s.length; i++) {
    let s1 = expand(i, i)   // 奇数长度
    let s2 = expand(i, i+1) // 偶数长度
    let longer = s1.length > s2.length ? s1 : s2
    if (longer.length > res.length) res = longer
  }

  return res
}