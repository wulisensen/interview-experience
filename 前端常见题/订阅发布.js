class EventBus {
  constructor() {
    // 使用 Map 存储事件及其对应的回调函数列表
    this.events = new Map();
  }

  /**
   * 订阅事件
   * @param {string} type 事件类型
   * @param {function} handler 回调函数
   */
  on(type, handler) {
    if (!this.events.has(type)) {
      this.events.set(type, []);
    }
    this.events.get(type).push(handler);
  }

  /**
   * 发布事件
   * @param {string} type 事件类型
   * @param  {...any} args 传递给回调函数的参数
   */
  emit(type, ...args) {
    const handlers = this.events.get(type);
    if (handlers) {
      // 复制一份数组，防止在回调中修改数组导致的问题（如 once）
      handlers.slice().forEach(handler => {
        handler(...args);
      });
    }
  }

  /**
   * 取消订阅
   * @param {string} type 事件类型
   * @param {function} handler 要移除的回调函数
   */
  off(type, handler) {
    const handlers = this.events.get(type);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
      // 如果该事件没有监听者了，则删除该事件类型
      if (handlers.length === 0) {
        this.events.delete(type);
      }
    }
  }

  /**
   * 只订阅一次
   * @param {string} type 事件类型
   * @param {function} handler 回调函数
   */
  once(type, handler) {
    const wrapper = (...args) => {
      handler(...args);
      this.off(type, wrapper);
    };
    this.on(type, wrapper);
  }
}

// 测试代码
const bus = new EventBus();

function test1(data) {
  console.log('test1 received:', data);
}

function test2(data) {
  console.log('test2 received:', data);
}

console.log('--- Testing on and emit ---');
bus.on('click', test1);
bus.on('click', test2);
bus.emit('click', 'Hello EventBus!'); // test1 and test2 should be called

console.log('\n--- Testing off ---');
bus.off('click', test1);
bus.emit('click', 'Only test2 should see this'); // only test2 should be called

console.log('\n--- Testing once ---');
bus.once('once-event', (data) => {
  console.log('once-event received:', data);
});
bus.emit('once-event', 'First time'); // should be called
bus.emit('once-event', 'Second time'); // should not be called

console.log('\n--- Testing parameters ---');
bus.on('sum', (a, b) => {
  console.log(`Sum of ${a} and ${b} is ${a + b}`);
});
bus.emit('sum', 10, 20);
