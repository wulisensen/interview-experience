# webpack构建过程
1. 初始化：读取配置、实例化 Compiler
2. 开始编译：从入口文件开始解析
3. 编译模块：调用对应 loader 转译文件
4. 递归依赖：解析 import/require，收集所有依赖
5. 封装 chunk：根据入口和拆分规则打包
6. 输出：生成资源文件到 dist

# Loader 执行顺序
从右往左、从下往上执行
例如：use: ['style-loader', 'css-loader', 'less-loader']
执行顺序：less-loader → css-loader → style-loader

# 常用插件
HtmlWebpackPlugin：生成 HTML，并自动引入打包资源
MiniCssExtractPlugin：抽离 CSS 为单独文件
CleanWebpackPlugin：打包前清空 dist
TerserWebpackPlugin：压缩 JS
CssMinimizerPlugin：压缩 CSS
DefinePlugin：注入全局变量
ProvidePlugin：自动加载模块（如 jQuery）
SplitChunksPlugin：拆分公共代码、第三方依赖