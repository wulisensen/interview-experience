/**
 * 手写实现 Promise.all
 * @param {Iterable} iterable - 可迭代对象（如数组），元素可以是Promise/普通值
 * @returns {Promise} - 新的Promise实例
 */
function myPromiseAll(iterable) {
  return new Promise((resolve, reject) => {
    try {
      const promises = Array.from(iterable);
      const result = [];
      let completeCount = 0;

      if (promises.length === 0) {
        return resolve(result);
      }

      promises.forEach((item, index) => {
        Promise.resolve(item).then((value) => {
          result[index] = value;
          completeCount++;
          if (completeCount === promises.length) {
            resolve(result);
          }
        }).catch((e) => {
          reject(e);
        }) 
      });
      
    } catch (error) {
      reject(error);
    }
  })
}

// -------------------------- 测试用例 --------------------------
// 测试1：所有Promise成功（验证顺序）
const p1 = Promise.resolve(1);
const p2 = new Promise(resolve => setTimeout(() => resolve(2), 1000));
const p3 = 3; // 普通值
myPromiseAll([p1, p2, p3]).then(res => {
    console.log(res); // [1, 2, 3]（顺序和入参一致，等待p2完成）
});

// 测试2：有一个Promise失败
const p4 = Promise.reject("出错了");
const p5 = Promise.resolve(5);
myPromiseAll([p5, p4]).catch(err => {
    console.log(err); // "出错了"（立即失败，不等待其他Promise）
});

// 测试3：空数组
myPromiseAll([]).then(res => {
    console.log(res); // []（直接resolve）
});

// 测试4：入参非可迭代对象（同步错误）
myPromiseAll(123).catch(err => {
    console.log(err); // TypeError: 123 is not iterable
});