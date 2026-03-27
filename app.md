# JsBridge 通信原理
一、JS 调用 Native
  1、URL Schema
    JS 动态创建 iframe，src 为约定协议如：myapp://bridge?action=scan
    Native 拦截 WebView 的 shouldOverrideUrlLoading
    解析协议、方法名、参数，执行对应原生逻辑
    缺点：连续调用容易丢失、有 URL 长度限制、效率一般
  2、 Native 注入 API 对象
    Android：addJavascriptInterface 注入对象
    iOS：WKWebView 用 WKScriptMessageHandler
    JS 直接调用：
  ```js
    window.NativeBridge.scanCode(params, callback)
  ```
二、Native 调 JS
  Native 直接执行 WebView 提供的 evaluateJavaScript 方法，
  拼接 JS 代码字符串，调用 window 上挂的全局函数。
  ```js
  // JS 先挂载
  window.onScanResult = (res) => { … }
  // Native 调用
  webView.evaluateJavascript("window.onScanResult(...)")
  ```

JsBridge 异步回调需要用 callbackId 做关联：
  1、JS 维护一个 callbacks 对象，每次调用生成唯一 callbackId；
  2、把回调函数存起来，将 method、params、callbackId 一起发给原生；
  3、原生执行完业务逻辑，带着 callbackId 回调 JS；
  4、JS 根据 callbackId 找到对应的回调函数执行并销毁。
    这样可以保证多次异步调用不会混乱，是最通用稳定的通信方案