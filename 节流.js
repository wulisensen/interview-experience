/**
 * 简单的节流函数（时间戳版）
 * @param {Function} func - 需要节流处理的函数
 * @param {number} delay - 节流的时间间隔，单位：毫秒
 * @returns {Function} - 经过节流处理后的函数
 */
function throttle(func, delay) {
  let lastRunTime = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastRunTime > delay) {
      func.apply(this, args);
      lastRunTime = now;
    }
  }
}


// ---------------- 测试用例 ----------------
// 模拟一个需要节流的函数
function handleScroll() {
  console.log('滚动事件触发，当前时间：', Date.now());
}

// 包装函数，设置1秒内只能执行一次
const throttledScroll = throttle(handleScroll, 1000);

// 模拟高频触发（比如快速滚动）
console.log('开始模拟高频触发：');
throttledScroll(); // 立即执行
setTimeout(throttledScroll, 200); // 200ms触发，不执行
setTimeout(throttledScroll, 500); // 500ms触发，不执行
setTimeout(throttledScroll, 1100); // 1100ms触发，执行