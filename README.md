# Pareto

[中文版](./README-zh.md)

Pareto is an SSR (Server Side Rendering) framework centered on stream rendering. Its goal is not to be a full-stack framework like `next.js` or `remix`, but to enhance regular SSR applications.

You can use `pareto` directly to create a new application, or you can refer to this [template](./examples/base/) to support stream rendering for your own SSR application.

## Purpose

Integrating stream rendering into an SSR application is a complex process, and unfortunately, there are no good practices to tell us how to integrate stream rendering. For instance, `next.js` simply binds `server component` and stream rendering together, while `remix` also requires using its custom `defer` and `loader` logic.

### About Stream Rendering

For articles about stream rendering, you can refer to <https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming#what-is-streaming> and <https://github.com/reactwg/react-18/discussions/22>.

In essence, stream rendering enhances your FCP (First Contentful Paint) and TTFB (Time to First Byte) metrics compared to traditional SSR. This enhancement is notable as it eliminates the need to stall for all concurrent server responses. Instead, we can selectively "stream" the response with the lengthiest processing time.
