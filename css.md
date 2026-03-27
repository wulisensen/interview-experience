# BFC 和 IFC 是什么？区别？
### BFC（Block Formatting Context）块级格式化上下文
  是一块独立的渲染区域，内部元素布局不会影响外部，外部也不会影响内部。
  触发方式：float 不为 none、position: absolute/fixed、overflow 不为 visible、display: flex/grid/inline-block、根元素等。
  作用：解决margin 塌陷、清除浮动、阻止元素被浮动元素覆盖。
### IFC（Inline Formatting Context）行内格式化上下文
  由多个行内元素在一行内排列形成。
  特点：水平排列、受 vertical-align、line-height 影响，一行放不下自动换行。
  常见场景：文本、span、a 等行内元素组成的布局。
### 区别
  BFC 内部是块级元素垂直排列，IFC 内部是行内元素水平排列。
  BFC 是独立隔离区域，IFC 主要负责文本 / 行内元素的行排布。
  BFC 能解决 margin 重叠、浮动问题，IFC 不具备这些特性。