const path = require('path');
const webpack = require('webpack');

module.exports = {
  mode: 'production',
  entry: {
    // 将基础库重命名为 base
    base: ['react', 'react-dom', 'dayjs'],
    // 新增 lodash DLL
    lodash: ['lodash']
  },
  output: {
    path: path.resolve(__dirname, 'dll'),
    filename: '[name].dll.js',
    // DLL 暴露出来的全局变量名
    library: '[name]_lib'
  },
  plugins: [
    new webpack.DllPlugin({
      // manifest.json 的生成路径
      path: path.resolve(__dirname, 'dll', '[name]-manifest.json'),
      // 与上面的 output.library 保持一致
      name: '[name]_lib',
      context: __dirname
    })
  ]
};
