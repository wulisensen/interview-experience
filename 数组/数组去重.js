var uniqueArray = (list) => {
  return [...new Set(list)]
}

var uniqueArray2 = (list) => {
  return list.filter((item, index) => index === list.indexOf(item))
}

var uniqueArray3 = (list) => {
  const cache = {};
  const result = [];
  for (const ele of list) {
    if (!cache.has(ele)) {
      result.push(ele)
    } else {
      cache.set(ele, 1)
    }
  }
  return result;
}

var uniqueArray4 = (list) => {
  return list.reduce((acc, cur) => {
    if (!acc.includes(cur)) {
      acc.push(cur)
    }
    return acc;
  }, [])
}