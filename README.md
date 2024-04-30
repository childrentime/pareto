# Pareto

Pareto is an SSR (Server Side Rendering) framework centered on stream rendering. Its goal is not to be a full-stack framework like `next.js` or `remix`, but to enhance regular SSR applications.

You can use `pareto` directly to create a new application, or you can refer to this [template](./examples/base/) to support stream rendering for your own SSR application.

## Why

Integrating stream rendering into an SSR application is a complex process, and unfortunately, there are no good practices to tell us how to integrate stream rendering. For instance, `next.js` simply binds `server component` and stream rendering together, while `remix` also requires using its custom `defer` and `loader` logic.

### Why Stream Rendering

For articles about stream rendering, you can refer to <https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming#what-is-streaming> and <https://github.com/reactwg/react-18/discussions/22>.

Simply put, stream rendering can improve your FCP (First Contentful Paint) and TTFB (Time to First Byte) times based on regular SSR. And it's a significant improvement because now we don't have to wait for all parallel interfaces on the server. We can "stream" the one with the longest return time.

## Features

- [ x ] Minimum Viable Version
- [ x ] Critical CSS extraction
- [ x ] Support for `react-helmet-async`
- [ ] Lazy compilation of routes, not yet supported by `rspack`
- [ x ] SPA mode
- [ x ] MobX example
- [ x ] Zustand example
- [ x ] Custom rspack configuration
- [ ] Support for Tailwind, there's a problem with rspack+tailwind's hmr
- [ ] CLI
