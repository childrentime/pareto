import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { RouterProvider, useRouterContext } from '../router/context'

function TestConsumer() {
  const ctx = useRouterContext()
  return createElement('div', {
    'data-pathname': ctx.pathname,
    'data-params': JSON.stringify(ctx.params),
    'data-navigating': String(ctx.isNavigating),
    'data-notfound': String(ctx.isNotFound),
  })
}

describe('RouterProvider', () => {
  it('renders children and provides initial state', () => {
    const html = renderToString(
      createElement(
        RouterProvider,
        {
          initialPathname: '/test',
          initialParams: { id: '1' },
          initialLoaderData: { name: 'Alice' },
          manifest: null,
        },
        createElement(TestConsumer),
      ),
    )

    expect(html).toContain('data-pathname="/test"')
    expect(html).toContain('data-navigating="false"')
    expect(html).toContain('data-notfound="false"')
  })

  it('provides initialNotFound state', () => {
    const html = renderToString(
      createElement(
        RouterProvider,
        {
          initialPathname: '/404',
          initialParams: {},
          initialLoaderData: null,
          initialNotFound: true,
          manifest: null,
        },
        createElement(TestConsumer),
      ),
    )

    expect(html).toContain('data-notfound="true"')
  })

  it('provides push, replace, back, prefetch methods', () => {
    function MethodChecker() {
      const ctx = useRouterContext()
      return createElement('div', {
        'data-push': typeof ctx.push,
        'data-replace': typeof ctx.replace,
        'data-back': typeof ctx.back,
        'data-prefetch': typeof ctx.prefetch,
        'data-set-loader-data': typeof ctx.setLoaderData,
      })
    }

    const html = renderToString(
      createElement(
        RouterProvider,
        {
          initialPathname: '/',
          initialParams: {},
          initialLoaderData: null,
          manifest: null,
        },
        createElement(MethodChecker),
      ),
    )

    expect(html).toContain('data-push="function"')
    expect(html).toContain('data-replace="function"')
    expect(html).toContain('data-back="function"')
    expect(html).toContain('data-prefetch="function"')
    expect(html).toContain('data-set-loader-data="function"')
  })

  it('provides loaderData through context', () => {
    function DataConsumer() {
      const ctx = useRouterContext()
      const data = ctx.loaderData as { count: number }
      return createElement('div', { 'data-count': String(data.count) })
    }

    const html = renderToString(
      createElement(
        RouterProvider,
        {
          initialPathname: '/',
          initialParams: {},
          initialLoaderData: { count: 42 },
          manifest: null,
        },
        createElement(DataConsumer),
      ),
    )

    expect(html).toContain('data-count="42"')
  })

  it('provides manifest through context', () => {
    function ManifestConsumer() {
      const ctx = useRouterContext()
      const hasRoutes =
        ctx.manifest && Object.keys(ctx.manifest.routes).length > 0
      return createElement('div', { 'data-has-routes': String(!!hasRoutes) })
    }

    const manifest = {
      routes: {
        '/': { path: '/', paramNames: [], hasLoader: false, hasHead: false },
      },
    }
    const html = renderToString(
      createElement(
        RouterProvider,
        {
          initialPathname: '/',
          initialParams: {},
          initialLoaderData: null,
          manifest,
        },
        createElement(ManifestConsumer),
      ),
    )

    expect(html).toContain('data-has-routes="true"')
  })
})

describe('useRouterContext', () => {
  it('throws when used outside RouterProvider', () => {
    expect(() => {
      renderToString(createElement(TestConsumer))
    }).toThrow('useRouter must be used within RouterProvider')
  })
})
