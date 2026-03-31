// 写一个 eventBus ，要求实现 on  emit off once 功能。
// 订阅要支持 nameSpace，支持 offNameSpace 按 nameSpace 取消订阅。
// emit 要支持异步执行, await eventBus.emit('logout:user')。
// 要支持按优先级顺序执行 如 on('login:user', async() => {}, {priority: 10})

class EventBus {
  constructor() {
    // 事件中心结构：{ 'eventName': [{ callback, priority, once, namespace }] }
    this.events = new Map();
  }

  /**
   * 订阅事件
   * @param {string} eventName - 事件名，支持 namespace:event 格式
   * @param {Function} callback - 回调函数
   * @param {Object} [options={}] - 配置项
   * @param {number} [options.priority=0] - 优先级，数字越大越先执行
   * @param {boolean} [options.once=false] - 是否只执行一次
   */
  on(eventName, callback, options = {}) {
    if (typeof eventName !== 'string' || typeof callback !== 'function') {
      console.warn('eventName 必须是字符串，callback 必须是函数');
      return;
    }

    const { priority = 0, once = false } = options;
    // 解析命名空间
    const namespace = eventName.split(':')[0] || '';

    // 不存在则初始化事件队列
    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }

    const eventList = this.events.get(eventName);
    // 添加订阅者
    eventList.push({
      callback,
      priority,
      once,
      namespace
    });

    // 按优先级降序排序（高优先级先执行）
    eventList.sort((a, b) => b.priority - a.priority);
  }

  /**
   * 只订阅一次事件
   */
  once(eventName, callback, options = {}) {
    this.on(eventName, callback, { ...options, once: true });
  }

  /**
   * 异步触发事件，支持 await
   */
  async emit(eventName, ...args) {
    if (!this.events.has(eventName)) return;

    const eventList = this.events.get(eventName);
    // 拷贝一份，防止执行中数组被修改
    const handlers = [...eventList];

    // 异步串行执行所有回调
    for (const handler of handlers) {
      try {
        await handler.callback(...args);
      } catch (err) {
        console.error(`Event ${eventName} 执行出错：`, err);
      }

      // 只执行一次的事件，执行后立即取消
      if (handler.once) {
        this.off(eventName, handler.callback);
      }
    }
  }

  /**
   * 取消单个事件的单个订阅
   */
  off(eventName, callback) {
    if (!this.events.has(eventName)) return;

    const eventList = this.events.get(eventName);
    const newList = eventList.filter(handler => handler.callback !== callback);

    if (newList.length === 0) {
      this.events.delete(eventName);
    } else {
      this.events.set(eventName, newList);
    }
  }

  /**
   * 按命名空间取消所有订阅（核心功能）
   */
  offNameSpace(namespace) {
    if (!namespace) return;

    for (const [eventName, eventList] of this.events.entries()) {
      // 过滤掉属于该命名空间的所有 handler
      const newList = eventList.filter(handler => handler.namespace !== namespace);
      
      if (newList.length === 0) {
        this.events.delete(eventName);
      } else {
        this.events.set(eventName, newList);
      }
    }
  }

  /**
   * 清空所有事件
   */
  clear() {
    this.events.clear();
  }
}

// 导出使用
export default EventBus;




// 初始化
const eventBus = new EventBus();

// ============== 1. 基础订阅/触发 ==============
eventBus.on('test', () => console.log('基础事件'));
eventBus.emit('test');

// ============== 2. 命名空间 + 优先级 ==============
// 高优先级先执行
eventBus.on('user:login', async () => {
  await new Promise(r => setTimeout(r, 100));
  console.log('优先级 10：用户登录');
}, { priority: 10 });

eventBus.on('user:login', () => {
  console.log('优先级 5：记录日志');
}, { priority: 5 });

// 异步触发，可 await
await eventBus.emit('user:login');

// ============== 3. once 只执行一次 ==============
eventBus.once('user:logout', () => console.log('只执行一次'));
eventBus.emit('user:logout');
eventBus.emit('user:logout'); // 不会执行

// ============== 4. 取消单个订阅 ==============
const cb = () => console.log('需要取消');
eventBus.on('test', cb);
eventBus.off('test', cb);

// ============== 5. 取消整个命名空间（核心） ==============
// 取消 user 命名空间下所有事件
eventBus.offNameSpace('user');
eventBus.emit('user:login'); // 无输出