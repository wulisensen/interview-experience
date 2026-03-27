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

# 热模块替换（HMR）原理解析
1、开发服务监听文件变化，文件修改后只增量编译改动模块，生成热更新补丁。
2、服务端通过 WebSocket 把更新信息推送到浏览器客户端。
3、客户端收到通知后，请求并加载新的模块代码。
4、按照模块依赖树递归替换旧模块，并由框架层（Vue/React）完成重新渲染，实现无刷新更新。

# vite 本地开发时，第三方包模块数量太多如何解决
1、依赖预构建，把大量文件合并
2、用 unplugin 插件实现图标自动按需引入，不用的不加载
3、禁止全量导入。按需引入
```js
// vite.config.js
import { defineConfig } from 'vite'
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'
import AutoImport from 'unplugin-auto-import/vite'

export default defineConfig({
  optimizeDeps: {
    // 关键：合并图标模块，解决请求过多
    include: ['@ant-design/icons-vue']
  },
  plugins: [
    // 自动按需引入图标
    AutoImport({
      resolvers: [
        IconsResolver({
          prefix: 'icon',
          enabledCollections: ['ant-design']
        })
      ]
    }),
    Icons({
      autoInstall: true,
      compiler: 'vue3'
    })
  ]
})
```

# webpack 如何支持 sass？需要哪些 loader
1. 核心依赖（必须装）
sass：真正把 SCSS/Sass 编译成 CSS 的编译器（dart-sass）
2. Loader 链（顺序不能错！）
  1、sass-loader：把 Sass → CSS
  2、css-loader：解析 @import 和 url()，把 CSS → CommonJS 模块
  3、style-loader 或 mini-css-extract-plugin：把 CSS 注入页面
    开发环境用：style-loader（快，支持 HMR）
    生产环境用：mini-css-extract-plugin（抽成单独 .css 文件）
```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.(s[ac]ss|css)$/i,
        // 顺序必须从右往左执行！
        use: [
          // 开发用 style-loader，生产用 MiniCssExtractPlugin.loader
          process.env.NODE_ENV === 'development' 
            ? 'style-loader' 
            : MiniCssExtractPlugin.loader,
          'css-loader', // 2. 解析 CSS
          'sass-loader' // 1. 编译 Sass → CSS
        ]
      }
    ]
  }
}
```
面试必背关键点
1、Loader 执行顺序是 从右向左 / 从下向上
2、sass 是必须的底层依赖，不是 loader
3、css-loader 负责解析 CSS 语法，没有它无法识别 @import
4、style-loader 把样式插入 style 标签，开发环境首选
5、生产环境必须抽离 CSS，用 mini-css-extract-plugin

# webpack 实现组件按需打包
1、Tree Shaking：生产环境自动剔除未使用代码，依赖 ES6 模块。
2、手动按需引入：从组件库单独导入需要的组件。
3、babel-plugin-import：最常用，自动实现按需引入，无需手动写路径，同时支持样式按需加载。

# webpack 的 html-webpack-plugin 作用
1、自动生成 HTML
  基于指定模板或默认结构，自动在输出目录生成 index.html。
2、自动注入打包资源
  自动把 Webpack 打包好的 bundle.js、css、favicon 等资源插入到 HTML 里，
  并且自动带上 hash 文件名，不用手动改引用路径。
3、支持 HTML 模板
  可以指定自己的 index.html 作为模板，保留原有结构、meta、title 等。
4、生产环境优化
  可配置压缩 HTML、删除注释、移除空格，减小体积。

# webpack 的 Tree Sharking 原理
1、依赖 ES6 模块静态分析
  import / export 是静态的：只能写在顶层、不能动态、不能在条件语句里
  Webpack 在编译时就能确定依赖关系，知道哪些导出被使用、哪些没被使用
2、标记无用代码Webpack 会对模块做依赖分析：
  被引用的导出：标记为 used
  没被任何地方引用的导出：标记为 unused
  对应配置：
  ```js
  optimization: {
    usedExports: true
  }
  ```
3、压缩阶段删除死代码
  标记完成后，由压缩工具（Terser）在代码压缩时真正删除未使用代码，实现 “摇掉无用树叶”。

## Tree Sharking 副作用代码
Tree Shaking 不能删除副作用代码，这类代码指模块执行时会改变全局状态、产生外部影响的代码，比如全局赋值、修改原型、顶层执行函数、polyfill、样式文件等。
我们可以通过 package.json 的 sideEffects 字段声明哪些文件有副作用，让 Webpack 避免误删，同时最大化优化无副作用的模块。

# webpack 不同 hash 类型生成原理
1、hash：项目级，改一个文件全部失效，不推荐。
2、chunkhash：chunk 级，按代码块生成，适合 JS 分包。
3、contenthash：文件内容级，独立计算，互不影响，CSS 必须用它。

# webpack  bundle、chunk、module 是什么
module：我们写的源码文件，是最小单位。
chunk：Webpack 打包时的逻辑代码块，由 module 组合而成。
bundle：chunk 经过编译压缩后，最终输出的文件。

# webpack 压缩 js 代码原理
先将代码转为 AST 抽象语法树，
再通过删除死代码、简化逻辑、常量折叠、变量混淆等方式优化 AST，
最后重新生成精简代码，实现体积最小化。

# webpack-dev-server 是如何启动并运行的？
1、启动服务执行 webpack serve 后，内部启动一个 Express HTTP 服务器，监听指定端口（如 3000）。
2、初始化编译内部调用 Webpack 执行一次完整编译，把资源打包到内存中，不写入磁盘 dist，所以速度极快。
3、创建中间件处理请求使用 webpack-dev-middleware 拦截浏览器请求：
  访问 / → 返回 HTML
  访问 /main.js → 从内存返回打包好的 JS
  所有资源都从内存读写，性能远高于读写文件。
4、建立 WebSocket 长连接服务器与浏览器建立 WebSocket 连接，用于后续推送更新消息。
5、监听文件变化监听项目文件改动，一旦修改：
  触发 Webpack 增量编译
  编译完成后通过 WebSocket 通知浏览器
6、更新页面
  开启 HMR：推送热更新，局部替换模块，不刷新页面
  未开启 HMR：自动触发浏览器刷新

# Webpack 持久化缓存通过四步实现：
1、splitChunks 分包，抽离第三方包 vendor；
2、抽离 runtimeChunk，保证 vendor hash 稳定；
3、文件名使用 chunkhash / contenthash；
4、HTML 不缓存，资源文件强缓存。
  最终实现：第三方包长效缓存，只更新业务代码。

# 为什么 js 文件走 chunk hash 而不是 contentHash
JS 本身就是独立 chunk，用 chunkhash 能保证内容不变 hash 不变，足够稳定。CSS 是从 JS chunk 抽离的，如果用 chunkhash，JS 一改 CSS 缓存就失效，所以必须用只跟自身内容相关的 contenthash。

# Webpack 模块化实现原理
1、把所有模块包装成独立函数Webpack 
  遍历所有文件，给每个 module 套一层函数作用域
2、维护一个模块缓存对象
  用一个对象存所有模块：
  ```js
  var __webpack_modules__ = {
    0: 模块0函数,
    1: 模块1函数,
    2: 模块2函数
  }
  ```
  key 就是 module ID（数字或路径）。
3、实现自己的加载函数：__webpack_require__
  替代原生 require / import，核心逻辑：
    查缓存，已加载直接返回
    未加载则执行模块函数
    把导出内容挂到 module.exports
    缓存并返回导出值给其他模块使用
      此处如果是 CommonJS
  ```js
    // commonJS
    const { sum } = __webpack_require__(/*! ./cmj */ './src/cmj.js');
    console.log(sum(1, 2));
    // ES module
    var _esm__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(
      /*! ./esm */ './src/esm.js'
    );
    (0, _esm__WEBPACK_IMPORTED_MODULE_0__['default'])(10, 5);
    (0, _esm__WEBPACK_IMPORTED_MODULE_0__.sum)(10, 5);
  ```

# 如何优化 webpack 构建速度
1、配置 alias、include/exclude 减少查找与编译范围
2、开启 thread-loader 多线程
3、开启 filesystem 缓存
4、Dll 或 splitChunks 抽离第三方包
5、开发环境关闭无用插件、优化 devtool
6、开启热更新

