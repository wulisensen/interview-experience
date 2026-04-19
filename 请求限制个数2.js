
const mockRequest = function (url) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() > 0.5) {
        resolve({ url });
      } else {
        reject(new Error(`请求 ${url} 失败`));
      }
    }, Math.random() * 1000);
  });
}

const useRequest = function ({ limit = 5 }) {

  let runingCount = 0;
  const pendingQueue = [];
  let showCommonError = true;

  const request = function (url) {

    const p = new Promise((resolve, reject) => {
      const runner = () => {
        runingCount++;
        mockRequest(url)
          .then((res) => {
            resolve(res);
          })
          .catch((e) => {
            if (showCommonError) {
              console.log(`common error: 请求 失败:`, e.message);
            }
            reject(e);
          })
          .finally(() => {
            runingCount--;
            const nextRunner = pendingQueue.shift();
            nextRunner && nextRunner();
          })
      }
      if (runingCount < limit) {
        runner();
      } else if (runingCount >= limit) {
        pendingQueue.push(runner);
        return;
      }
      
    })

    const proxyPromise = (target) => {
      return new Proxy(target, {
        get(target, key) {
          const value = target[key];

          if (typeof value === 'function') {
            // 核心：处理 catch 调用标识
            if (key === 'catch') {
              showCommonError = false;
            }

            // 核心修复：必须使用 bind(target) 绑定原始 Promise，否则 node 环境下会报 incompatible receiver
            // 并且需要递归代理返回的 Promise 以支持链式调用
            return (...args) => {
              const result = value.apply(target, args);
              return proxyPromise(result);
            };
          }

          return value;
        }
      });
    };

    return proxyPromise(p);
  }

  return {
    request,
  }

}

// --- 调用示例 ---

// 1. 初始化 hook，设置最大并发限制为 3
const { request } = useRequest({ limit: 5 });

// 2. 同时发起 10 个请求
console.log('开始发起 请求...');
for (let i = 1; i <= 20; i++) {
  // 这里演示两种调用方式：
  
    request('url-' + i)
      .then(res => console.log(`请求 ${i} 成功:`, res))
      .catch(e => console.log(`请求 ${i} 失败:`, e));
}
