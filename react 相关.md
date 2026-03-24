# react hooks 哪些情况不能调用
react hooks 不能在 if 条件 和 循环中调用，因为 react 会依赖 hooks 的调用顺序维护 状态与hooks 的映射关系，顺序改变会导致状态错乱
不能在普通函数，因为会找不到 hooks 的上下文。不能在 class 组件中调用，因为 class 有自己的 state 管理，两者不互相兼容。
不能在渲染周期之外，比如 定时器中
不能在解构、赋值表达式中调用

# 18 有什么新特性？
1、新的根节点创建方式：createRoot
2、自动批处理
  React 17 问题：只有 React 事件回调内的状态更新会批处理，异步回调（setTimeout / 网络请求）中的更新会触发多次渲染。
  React 18 改进：所有场景（同步 / 异步、原生事件 / 定时器）都自动批处理。
  如需禁用自动批处理，可以使用 flushSync
3、并发特性：useDeferredValue 和 useTransition
  useTransition：标记低优先级更新
  ```jsx
    const [isPending, startTransition] = useTransition(); // 标记过渡状态
    startTransition(() => {
      。。。。。。。
    });
    useDeferredValue：延迟更新值
    const [input, setInput] = useState('');
    // 延迟更新 input 值，优先保证父组件渲染
    const deferredInput = useDeferredValue(input);
    {/* 子组件接收延迟值，避免高频重渲染阻塞输入 */}
    <HeavyList value={deferredInput} />
  ```
4、Suspense增强（支持数据请求）
  子组件使用useSWR 开启 suspense: true 后，请求数据时可以展示 Suspense 的 fallback
5、其他小特性
  useId: 生成跨服务端 / 客户端的唯一 ID，解决 SSR 时 ID 不匹配问题
  renderToPipeableStream/renderToReadableStream：优化 SSR 流式渲染，提升首屏加载速度。

# 19 有什么新特性
1、useActionState：用于表单，绑定 Action，自动管理 state/loading/error
2、useOptimistic: 乐观更新。配合 Actions 使用，提前更新 UI，提升用户体验（如点赞、评论提交时，先显示 “已点赞”，再等待接口响应）：
  ```jsx
  function Post({ postId, initialLiked }) {
    const [state, likeAction, isPending] = useActionState(likePost, {
      liked: initialLiked,
    });
      // 乐观更新：立即更新 UI，无需等待接口响应
    const [optimisticState, addOptimistic] = useOptimistic(
      state,
      (currentState, newState) => ({ ...currentState, ...newState })
    );
    const handleLike = () => {
      // 先乐观更新 UI
      addOptimistic({ liked: true });
      // 再执行实际接口请求
      likeAction(postId);
    };
    return (
      <div>
        <button onClick={handleLike} disabled={isPending}>
          {optimisticState.liked ? '已点赞' : '点赞'}
        </button>
      </div>
    );
  }
  ```
  3、内置服务器组件（RSC）支持
  4、简化Hooks: useMemo 和 useCallback 自动优化
  5、其他
    useContextSelector: 精准订阅context 中的部分数据，避免Context整体更新导致的不必要渲染
    内置图片优化：<img> 标签原生支持 loading="lazy"、fetchpriority，配合 Suspense 实现图片加载状态统一管理；
    错误边界增强：useErrorBoundary 替代类组件的 componentDidCatch，函数组件可直接捕获子组件错误：

# 虚拟 dom diff 算法
1、React Diff 算法的核心是「同层对比 + key 唯一标识 + 类型判断」，时间复杂度优化为 O (n)；
2、列表 Diff 是重点，通过 key 快速定位节点，结合最长递增子序列优化移动逻辑；
3、组件节点对比优先复用实例，仅更新属性 / 内部节点；
4、最佳实践：列表加唯一 key、减少节点层级、用 React.memo 跳过不必要的 Diff