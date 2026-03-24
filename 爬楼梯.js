/**
 * @param {number} n
 * @return {number}
 */
var climbStairs = function(n) {
    if (n === 1) return 1;
    if (n === 2) return 2;

    let pre = 2;
    let prePre = 1;
    let current;

    for(var i = 3; i <= n; i ++) {
        current = pre + prePre;
        prePre = pre;
        pre = current;
    }

    return current;
};