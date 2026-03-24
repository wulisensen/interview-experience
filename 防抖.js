const debounce = (fn, delay) => {
  let timer = null;
  return function(...arg) {
    timer = setTimeout(() => {
      clearTimeout(timer);
      fn.apply(this, arg);
    }, delay)
  }
}

const search = debounce((keyword) => {
  console.log(keyword)
}, 300)