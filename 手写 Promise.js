const PENDING = 'PENDING';
const FULFILLED = 'FULFILLED';
const REJECTED = 'REJECTED';

class MyPromise {
  constructor(executor) {
    this.status = PENDING;
    this.value = undefined;
    this.reason = undefined;
    this.onResolvedCallbacks = [];
    this.onRejectedCallbacks = [];

    let resolve = (value) => {
      if (value instanceof MyPromise) {
        return value.then(resolve, reject);
      }
      if (this.status === PENDING) {
        this.status = FULFILLED;
        this.value = value;
        this.onResolvedCallbacks.forEach(fn => fn());
      }
    }

    let reject = (reason) => {
      if (this.status === PENDING) {
        this.status = REJECTED;
        this.reason = reason;
        this.onRejectedCallbacks.forEach(fn => fn());
      }
    }

    try {
      executor(resolve, reject);
    } catch(e) {
      reject(e);
    }
  }

  then(onFulfilled, onRejected) {
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : v => v;
    onRejected = typeof onRejected === 'function' ? onRejected : err => { throw err };

    return new MyPromise((resolveNext, rejectNext) => {
      if (this.status === FULFILLED) {
        queueMicrotask(() => {
          try {
            const x = onFulfilled(this.value)
            resolvePromise(x, resolveNext, rejectNext);
          } catch (error) {
            rejectNext(error)
          }
        })
      }

      if (this.status === REJECTED) {
        queueMicrotask(() => {
          try {
            const x = onRejected(this.reason)
            resolvePromise(x, resolveNext, rejectNext)
          } catch (err) {
            rejectNext(err)
          }
        })
      }

      if (this.status === PENDING) {
        this.onResolvedCallbacks.push(() => () => {
          queueMicrotask(() => {
            try {
              const x = onFulfilled(this.value)
              resolvePromise(x, resolveNext, rejectNext);
            } catch (error) {
              rejectNext(error)
            }
          })
        })
        this.onRejectedCallbacks.push(() => {
          queueMicrotask(() => {
            try {
              const x = onRejected(this.reason)
              resolvePromise(x, resolveNext, rejectNext)
            } catch (err) {
              rejectNext(err)
            }
          })
        })
      }

    }) 

  }

  catch(errorCallback) {
    return this.then(null, errorCallback);
  }

  finally(callback) {
    return this.then((value) => {
      return MyPromise.resolve(callback()).then(() => value)
    }, (reason) => {
      return MyPromise.resolve(callback()).then(() => {throw reason})
    })
  }

  static resolve(data) {
    return new Promise((resolve) => {
      resolve(data);
    })
  }

  static reject(data) {
    return new Promise((_, reject) => {
      reject(data);
    })
  }

  static all(promises) {
    return new Promise((resolve, reject) => {
      let resultArray = [];
      let orderIndex = 0;
      function processResultByKey(value, i) {
        resultArray[i] = value;
        orderIndex++;
        if (orderIndex + 1 === promises.length) {
          resolve(resultArray);
        }
      }
      for (let i = 0; i < promises.length; i++) {
        const p = promises[i];
        if (p && typeof p.then === 'function') {
          value.then((value) => {
            processResultByKey(value, i)
          }, reject)
        } else {
          processResultByKey(value, i)
        }
      }
    })
  }

  static race(promises) {
    return new Promise((resolve, reject) => {
      for (let i = 0; i < promises.length; i++) {
        const p = promises[i];
        if (p && typeof p === 'function') {
          p.then(resolve, reject)
        } else {
          resolve(p)
        }
      }
    })
  }
}

function resolvePromise(x, resolve, reject) {
  if (x instanceof MyPromise) {
    x.then(resolve, reject)
  } else {
    resolve(x);
  }
}