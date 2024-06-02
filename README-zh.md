# Pareto

Pareto 是一个以流式渲染为核心的 SSR（服务器端渲染）框架。 它的目标不是一个类似 `next.js` 或者 `remix` 的全栈框架，而是旨在对常规的 SSR应用进行增强。

你可以直接用 `pareto` 来新建应用，也可以参考这个[模板](./examples/base/)来为你自己的 SSR 应用支持流式渲染功能。

## 目的

在SSR应用中接入流式渲染是一个复杂的过程，并且遗憾的是，没有一些好的实践来告诉我们怎么接入流式渲染。像next.js 干脆将 `server component` 和流式渲染强行绑定了，而 remix 也需要使用它自定义的 `defer` 和 `loader` 逻辑。

### 关于流式渲染

关于流式渲染的文章，可以参考 <https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming#what-is-streaming> <https://github.com/reactwg/react-18/discussions/22>

简单来说，流式渲染可以在常规 SSR 的基础上提升你的 FCP,TTFB 时间。并且它是一个非常大的提升，因为现在我们不需要在服务器上等待所有的的并行接口，我们可以把接口返回时间最长的那个给“流式掉“
