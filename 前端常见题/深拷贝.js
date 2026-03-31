function deepClone(obj, map = new WeakMap()) {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (map.has(obj)) return map.get(obj); // 处理循环引用

  const target = Array.isArray(obj) ? [] : {};
  map.set(obj, target);

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      target[key] = deepClone(obj[key], map);
    }
  }
  return target;
}

// ==================== 测试用例 ====================
console.log('========== 基础功能测试 ==========');

// 1. 基本数据类型测试
console.log('1. 基本数据类型测试:');
const testBasic = {
  num: 123,
  str: 'test',
  bool: true,
  nul: null,
  und: undefined,
  sym: Symbol('test'),
  bigInt: BigInt(123456)
};
const clonedBasic = deepClone(testBasic);
console.log('   数字拷贝正确:', clonedBasic.num === testBasic.num); // true
console.log('   字符串拷贝正确:', clonedBasic.str === testBasic.str); // true
console.log('   null拷贝正确:', clonedBasic.nul === testBasic.nul); // true
console.log('   Symbol丢失:', clonedBasic.sym === undefined); // true (该版本不支持Symbol属性)
console.log('   BigInt拷贝正确:', clonedBasic.bigInt === testBasic.bigInt); // true

// 2. 数组测试
console.log('\n2. 数组测试:');
const testArr = [1, 2, [3, 4, { a: 5 }]];
const clonedArr = deepClone(testArr);
console.log('   数组引用独立:', clonedArr !== testArr); // true
console.log('   嵌套数组引用独立:', clonedArr[2] !== testArr[2]); // true
console.log('   数组值正确:', clonedArr[2][0] === testArr[2][0]); // true

// 3. 普通对象测试
console.log('\n3. 普通对象测试:');
const testObj = {
  a: 1,
  b: { c: 2, d: { e: 3 } }
};
const clonedObj = deepClone(testObj);
console.log('   对象引用独立:', clonedObj !== testObj); // true
console.log('   嵌套对象引用独立:', clonedObj.b !== testObj.b); // true
console.log('   对象值正确:', clonedObj.b.d.e === testObj.b.d.e); // true

// 4. 循环引用测试 (核心功能)
console.log('\n4. 循环引用测试:');
const cycleObj = { name: 'cycle' };
cycleObj.self = cycleObj; // 自引用
cycleObj.child = { parent: cycleObj }; // 交叉引用
const clonedCycle = deepClone(cycleObj);
console.log('   自引用处理正确:', clonedCycle.self === clonedCycle); // true
console.log('   交叉引用处理正确:', clonedCycle.child.parent === clonedCycle); // true

console.log('\n========== 局限性测试 ==========');

// 5. Symbol属性测试 (该版本不支持)
console.log('5. Symbol属性测试:');
const symKey = Symbol('key');
const symObj = { [symKey]: 'symbol value' };
const clonedSymObj = deepClone(symObj);
console.log('   Symbol键属性丢失:', clonedSymObj[symKey] === undefined); // true

// 6. 不可枚举属性测试 (该版本不支持)
console.log('\n6. 不可枚举属性测试:');
const nonEnumObj = { a: 1 };
Object.defineProperty(nonEnumObj, 'b', {
  value: 2,
  enumerable: false // 不可枚举
});
const clonedNonEnumObj = deepClone(nonEnumObj);
console.log('   不可枚举属性丢失:', clonedNonEnumObj.b === undefined); // true

// 7. 特殊对象测试 (Date/RegExp/Map/Set，该版本不支持)
console.log('\n7. 特殊对象测试:');
const specialObj = {
  date: new Date(),
  reg: /test/g,
  map: new Map([['key', 'value']]),
  set: new Set([1, 2, 3])
};
const clonedSpecialObj = deepClone(specialObj);
console.log('   Date拷贝异常:', clonedSpecialObj.date instanceof Date); // false (变成普通对象)
console.log('   RegExp拷贝异常:', clonedSpecialObj.reg instanceof RegExp); // false (变成普通对象)
console.log('   Map拷贝异常:', clonedSpecialObj.map instanceof Map); // false (变成普通对象)
console.log('   Set拷贝异常:', clonedSpecialObj.set instanceof Set); // false (变成普通对象)

// 8. 原型链属性测试 (该版本不支持)
console.log('\n8. 原型链属性测试:');
function Person(name) {
  this.name = name;
}
Person.prototype.sayHi = function() { return 'hi'; };
const person = new Person('test');
const clonedPerson = deepClone(person);
console.log('   原型方法丢失:', typeof clonedPerson.sayHi === 'undefined'); // true
console.log('   实例类型异常:', clonedPerson instanceof Person); // false (原型链丢失)

// 9. 函数测试 (该版本直接返回引用)
console.log('\n9. 函数测试:');
const funcObj = {
  fn: function() { return 123; },
  arrowFn: () => 456
};
const clonedFuncObj = deepClone(funcObj);
console.log('   函数引用相同:', clonedFuncObj.fn === funcObj.fn); // true (未深拷贝)
console.log('   箭头函数引用相同:', clonedFuncObj.arrowFn === funcObj.arrowFn); // true