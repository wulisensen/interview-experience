const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const AddAssetHtmlPlugin = require('add-asset-html-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html'
    }),
    // 引用 base DLL
    new webpack.DllReferencePlugin({
      context: __dirname,
      manifest: require('./dll/base-manifest.json')
    }),
    // 引用 lodash DLL
    new webpack.DllReferencePlugin({
      context: __dirname,
      manifest: require('./dll/lodash-manifest.json')
    }),
    // 自动将生成的 base.dll.js 插入到 html 中
    new AddAssetHtmlPlugin({
      filepath: path.resolve(__dirname, 'dll/base.dll.js'),
      publicPath: './'
    }),
    // 自动将生成的 lodash.dll.js 插入到 html 中
    new AddAssetHtmlPlugin({
      filepath: path.resolve(__dirname, 'dll/lodash.dll.js'),
      publicPath: './'
    })
  ]
};
