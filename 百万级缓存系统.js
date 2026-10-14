// 算法题：带过期时间的缓存
// 1. 设计一个带过期时间的缓存：每个 key 可以设置过期时间；要求 get 时对过期 key 返回空；size() 返回的缓存大小不能包含已过期的数据；现在没有写代码的平台，先聊思路。（00:34:29）
// 2. 补充：缓存会有一些基础 KPI（如容量、size 等），这些 KPI 在做数据查询或统计时，要考虑到过期的数据。（00:35:36 / 00:36:16）
// 3. 确认实现思路：每次 get 时判断该 value 的过期时间，与当前时间比较？（00:39:15）
class MinHeap {
  constructor() {
    this.heap = [];
  }

  get size() {
    return this.heap.length;
  }

  // 比较两个节点：先过期的优先
  less(a, b) {
    return a.expireAt < b.expireAt;
  }

  // 插入节点：O(log n)
  push(item) {
    const heap = this.heap;
    heap.push(item);

    let i = heap.length - 1;

    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);

      if (!this.less(heap[i], heap[parent])) break;

      [heap[i], heap[parent]] = [heap[parent], heap[i]];
      i = parent;
    }
  }

  // 查看最早过期节点：O(1)
  peek() {
    return this.heap[0] ?? null;
  }

  // 弹出最早过期节点：O(log n)
  pop() {
    const heap = this.heap;

    if (heap.length === 0) return null;

    const first = heap[0];
    const last = heap.pop();

    if (heap.length > 0) {
      heap[0] = last;
      let i = 0;

      while (true) {
        const left = i * 2 + 1;
        const right = i * 2 + 2;
        let smallest = i;

        if (
          left < heap.length &&
          this.less(heap[left], heap[smallest])
        ) {
          smallest = left;
        }

        if (
          right < heap.length &&
          this.less(heap[right], heap[smallest])
        ) {
          smallest = right;
        }

        if (smallest === i) break;

        [heap[i], heap[smallest]] =
          [heap[smallest], heap[i]];

        i = smallest;
      }
    }

    return first;
  }

  clear() {
    this.heap = [];
  }
}

class TTLCache {
  constructor() {
    this.cache = new Map();
    this.expiryHeap = new MinHeap();

    this.validSize = 0;
    this.nextVersion = 0;
  }

  // 清理所有已过期的有效记录
  cleanupExpired() {
    const now = Date.now();

    while (true) {
      const record = this.expiryHeap.peek();

      // 最早的都没过期，后面的也不会过期
      if (!record || record.expireAt > now) {
        break;
      }

      this.expiryHeap.pop();

      const current = this.cache.get(record.key);

      // 记录已被删除，或者 key 已经被重新写入
      if (
        !current ||
        current.version !== record.version
      ) {
        continue;
      }

      this.cache.delete(record.key);
      this.validSize--;
    }
  }

  // 写入缓存，ttl 单位为毫秒
  put(key, value, ttl) {
    // 先清理已过期记录，保证计数正确
    this.cleanupExpired();

    // 非正 TTL 表示不保留该缓存
    if (ttl <= 0) {
      this.delete(key);
      return;
    }

    // 覆盖已有有效数据，计数不能重复增加
    if (this.cache.has(key)) {
      this.cache.delete(key);
      this.validSize--;
    }

    const expireAt = Date.now() + ttl;
    const version = ++this.nextVersion;

    this.cache.set(key, {
      value,
      expireAt,
      version,
    });

    // 每次写入都记录一条过期事件
    this.expiryHeap.push({
      key,
      expireAt,
      version,
    });

    this.validSize++;
  }

  // 查询缓存
  get(key) {
    const item = this.cache.get(key);

    if (!item) return null;

    if (Date.now() >= item.expireAt) {
      // 只有当前记录仍存在时才删除、递减
      this.cache.delete(key);
      this.validSize--;
      return null;
    }

    return item.value;
  }

  // 获取有效缓存数量
  size() {
    this.cleanupExpired();
    return this.validSize;
  }

  // 删除指定 key
  delete(key) {
    if (!this.cache.has(key)) {
      return false;
    }

    this.cache.delete(key);
    this.validSize--;
    return true;
  }

  // 清空缓存
  clear() {
    this.cache.clear();
    this.expiryHeap.clear();
    this.validSize = 0;
  }
}


