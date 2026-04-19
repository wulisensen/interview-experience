
type Request = (url: string) => Promise<any>

type UseRequest = (options: { limit: number }) => {
  request: Request
}

// pending queue里面的runner实际上就是一个函数类型，没有参数也没有返回值

type runner = () => void;

// 这里我们mock一下异步请求
const mockAixos = (url: string) => {
  const random = Math.floor(Math.random() * 1001);
  return new Promise((res, rej) => {
    setTimeout(() => {
      // 看error处理的时候调用rej,否则调用res
      rej('err');

      // res(`request ${url} success!`);
    }, random)
  })
}

export const useRequest: UseRequest = ({ limit = 5 }) => {

  let runingCount: number = 0;
  const pendingQueue: runner[] = [];

  // 实现request内部
  const request = (url: string) => {
    // 由我们定义的request类型可知，我们需要返回一个promise,那么整个request首先我们需要构造一个promise实例并返回
    // 由于100次的request请求是同步调用的，我们去做限流的时候会把暂时不能执行的请求缓存起来，所以这promise的resolve的执行时机，是调用方可以正确执行request('/test').then()的关键

    // 构造我们的执行，并发限流处理的核心思路为我们需要设计一个执行器runner, 这个runner会执行一个异步过程，同时在异步过程完成的时候，去检查我们的pendingQueue里（缓存池）面还有没有带执行的任务
    // 如果有的话，取一个出来执行，是一个典型的泳池模型

    // 这里有一个闭包内的状态来存储是否在外面调用了.catch
    let outerCatch = false;
    const p = new Promise((resolve, reject) => {
      const runner = () => {
        runingCount++
        mockAixos(url).then((response) => {
          // 这里是关键，这个resolve 包裹在runner里面，那么实际这个resolve是每次调用request()时候创建的promise的实例的resovle
          // 那么如果这里延迟执行，这个resolve也会延迟执行，外面获取的promise是pending，直到runner运时返回结果，这里才会触发resolve，那么调用的地方就可以拿到对应的response了
          resolve(response)
          // 同时runner运行完毕，我们需要把正在执行的runner计数器-1
          runingCount--;
          // 最后我们检查，在pendingQueue里面还有没有带执行的runner
          const nextRunner = pendingQueue.shift();
          nextRunner && nextRunner();
        }).catch((err: string) => {
          // 这里异常处理依据outer catch，是内部处理还是抛出
          if (outerCatch) {
            reject(err)
          } else {
            alert(`global error procee ${err}`);
          }
        })
      }
      // 首先我们先处理前5次请求，直接运行runner执行即可
      if (runingCount < 5) {
        runner();
      } else {
        // 如果正在运行的runner数量大于等于limit了，我们把runner推到pendingQueue里面
        pendingQueue.push(runner);
      }
    })
    // 通过proxy代理返回的promise,
    // 因为promise是链式返回新的promise对象
    // 所以我们这里需要递归的对promise的then\catch\fanally等api的返回结果再次进行代理

    const proxyPromise = (targetPromise) => {
      return new Proxy(targetPromise, {
        get(target: any, key: string) {

          // 这里如果是调用catch, 则设置outerCatch为true, 表示在外面调用了catch
          if (key === 'catch') {
            outerCatch = true;
          }

          // 其他情况下，所有的都返回再次代理的新promise对象
          return (cb: any) => {

            // 关键点1: 这里已经是proxy的对象了，所以一定要把api都bind回原本的promise再执行
            const p = target[key].bind(target)(cb);

            // 关键点2: 返回新的代理的promise
            return proxyPromise(p);
          };
        }
      })
    }
    return proxyPromise(p);
  }
  // 首先实现我们hooks的返回值，即request方法
  return {
    request,
  }

}
