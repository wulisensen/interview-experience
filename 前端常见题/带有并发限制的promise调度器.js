/**
 * 带并发限制的 Promise 调度器
 * @param {number} limit - 最大并发数
 */
class PromiseScheduler {
  constructor(limit) {
    this.limit = limit;
    this.running = 0;
    this.queue = []
  }

  add(task) {
    return new Promise((resolve, reject) => {
      this.queue.push({
        task,
        resolve,
        reject,
      })
    })
  }

  start() {
    for (const _ of this.queue) {
      this.runNext();
    }
  }

  runNext() {
    if (this.queue.length === 0 || this.running >= this.limit) return;

    const { task, resolve, reject }  = this.queue.shift();

    this.running++;

    task()
      .then((result) => {
        resolve(result)
      })
      .catch((e) => {
        reject(e);
      })
      .finally(() => {
        this.running--;
        this.runNext();
      })
  }
}

// -------------------------- 测试用例 --------------------------
// 模拟异步任务（比如接口请求）
function createTask(id, delay) {
  return () =>
    new Promise((resolve) => {
      setTimeout(() => {
        console.log(`任务${id}完成`);
        resolve(`结果${id}`);
      }, delay);
    });
}

// 1. 创建调度器，设置最大并发数为 2
const scheduler = new PromiseScheduler(2);

// 2. 添加 5 个任务（并发限制为2，因此先执行任务1、2，完成后执行3、4，最后执行5）
scheduler.add(createTask(1, 1000));
scheduler.add(createTask(2, 500));
scheduler.add(createTask(3, 300));
scheduler.add(createTask(4, 800));
scheduler.add(createTask(5, 200));

// 3. 等待所有任务完成，获取结果
scheduler.start()

/**
 * 执行顺序输出（关键验证并发限制）：
 * 500ms 后 → 任务2完成
 * 此时并发数空出1个，执行任务3 → 300ms 后（总800ms）→ 任务3完成
 * 并发数空出1个，执行任务4 → 800ms 后（总1600ms）→ 任务4完成
 * 并发数空出1个，执行任务5 → 200ms 后（总1800ms）→ 任务5完成
 * 1000ms 后（总1000ms）→ 任务1完成
 * 最终所有任务结果按添加顺序返回
 */