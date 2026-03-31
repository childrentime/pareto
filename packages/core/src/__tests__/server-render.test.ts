import { createElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRequestHandler } from '../render/server'
import type { RouteDef, RouteManifest } from '../types'
import { ParetoNotFound, ParetoRedirect } from '../types'

function makeRoute(overrides: Partial<RouteDef> = {}): RouteDef {
  return {
    path: '/',
    pattern: /^\/$/,
    paramNames: [],
    segments: [],
    componentPath: '/app/page.tsx',
    layoutPaths: [],
    headPaths: [],
    isDynamic: false,
    isCatchAll: false,
    isResource: false,
    ...overrides,
  }
}

const emptyManifest: RouteManifest = { routes: {} }

function Page() {
  return createElement('div', null, 'Hello')
}

function NotFound() {
  return createElement('div', null, 'Not Found')
}

function ErrorPage({ error }: { error: Error }) {
  return createElement('div', null, error.message)
}

function Layout({ children }: { children: React.ReactNode }) {
  return createElement('div', { className: 'layout' }, children)
}

const modules: Record<string, Record<string, unknown>> = {
  '/app/page.tsx': { default: Page },
  '/app/not-found.tsx': { default: NotFound },
  '/app/error.tsx': { default: ErrorPage },
  '/app/layout.tsx': { default: Layout },
}

function mockReq(
  path: string,
  method = 'GET',
  query: Record<string, string> = {},
): any {
  return { path, method, url: path, query }
}

function mockRes(): any {
  const res: any = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: '',
    ended: false,
    redirected: null as { status: number; url: string } | null,
    jsonData: null,
    headersSent: false,
    setHeader(name: string, value: string) {
      res.headers[name] = value
    },
    status(code: number) {
      res.statusCode = code
      return res
    },
    end(data?: string) {
      res.body = data ?? ''
      res.ended = true
    },
    json(data: unknown) {
      res.jsonData = data
      res.headersSent = true
    },
    redirect(status: number, url: string) {
      res.redirected = { status, url }
      res.headersSent = true
    },
    write(chunk: string) {
      res.body += chunk
    },
    pipe: undefined,
  }
  return res
}

describe('createRequestHandler', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'production'
  })

  it('returns a function', () => {
    const handler = createRequestHandler({
      routes: [makeRoute()],
      manifest: emptyManifest,
      requireModule: p => modules[p],
      clientEntry: [],
    })
    expect(typeof handler).toBe('function')
  })

  it('calls next() when no route matches and no notFoundPath', async () => {
    const handler = createRequestHandler({
      routes: [makeRoute()],
      manifest: emptyManifest,
      requireModule: p => modules[p],
      clientEntry: [],
    })

    const req = mockReq('/nonexistent')
    const res = mockRes()
    const next = vi.fn()

    await handler(req, res, next)
    expect(next).toHaveBeenCalled()
  })

  it('handles /__pareto/data requests', async () => {
    const route = makeRoute({
      loaderPath: '/app/loader.ts',
    })

    const handler = createRequestHandler({
      routes: [route],
      manifest: emptyManifest,
      requireModule: p => {
        if (p === '/app/loader.ts') return { loader: () => ({ title: 'Test' }) }
        return modules[p] ?? {}
      },
      clientEntry: [],
    })

    const req = mockReq('/__pareto/data', 'GET', { path: '/' })
    const res = mockRes()

    await handler(req, res)
    expect(res.jsonData).toBeTruthy()
    expect(res.jsonData.loaderData).toEqual({ title: 'Test' })
    expect(res.jsonData.params).toEqual({})
  })

  it('handles data request with missing path parameter', async () => {
    const handler = createRequestHandler({
      routes: [makeRoute()],
      manifest: emptyManifest,
      requireModule: p => modules[p],
      clientEntry: [],
    })

    const req = mockReq('/__pareto/data', 'GET', {})
    const res = mockRes()

    await handler(req, res)
    expect(res.statusCode).toBe(400)
    expect(res.jsonData).toEqual({ error: 'Missing path parameter' })
  })

  it('handles data request with unmatched route', async () => {
    const handler = createRequestHandler({
      routes: [makeRoute()],
      manifest: emptyManifest,
      requireModule: p => modules[p],
      clientEntry: [],
    })

    const req = mockReq('/__pareto/data', 'GET', { path: '/nonexistent' })
    const res = mockRes()

    await handler(req, res)
    expect(res.statusCode).toBe(404)
    expect(res.jsonData).toEqual({ error: 'Route not found' })
  })

  it('handles redirect from loader', async () => {
    const route = makeRoute({
      loaderPath: '/app/redirect-loader.ts',
    })

    const handler = createRequestHandler({
      routes: [route],
      manifest: emptyManifest,
      requireModule: p => {
        if (p === '/app/redirect-loader.ts') {
          return {
            loader: () => {
              throw new ParetoRedirect('/login', 302)
            },
          }
        }
        return modules[p] ?? {}
      },
      clientEntry: [],
    })

    const req = mockReq('/')
    const res = mockRes()

    await handler(req, res)
    expect(res.redirected).toEqual({ status: 302, url: '/login' })
  })

  it('handles notFound from loader in data request', async () => {
    const route = makeRoute({
      loaderPath: '/app/notfound-loader.ts',
    })

    const handler = createRequestHandler({
      routes: [route],
      manifest: emptyManifest,
      requireModule: p => {
        if (p === '/app/notfound-loader.ts') {
          return {
            loader: () => {
              throw new ParetoNotFound()
            },
          }
        }
        return modules[p] ?? {}
      },
      clientEntry: [],
      notFoundPath: '/app/not-found.tsx',
    })

    const req = mockReq('/__pareto/data', 'GET', { path: '/' })
    const res = mockRes()

    await handler(req, res)
    expect(res.statusCode).toBe(404)
    expect(res.jsonData).toEqual({ error: 'Not found' })
  })

  it('handles resource route GET', async () => {
    const route = makeRoute({
      path: '/api/users',
      pattern: /^\/api\/users\/?$/,
      componentPath: '/app/api/route.ts',
      isResource: true,
    })

    const handler = createRequestHandler({
      routes: [route],
      manifest: emptyManifest,
      requireModule: p => {
        if (p === '/app/api/route.ts') {
          return { loader: () => [{ id: 1 }] }
        }
        return {}
      },
      clientEntry: [],
    })

    const req = mockReq('/api/users')
    const res = mockRes()

    await handler(req, res)
    expect(res.jsonData).toEqual([{ id: 1 }])
  })

  it('handles resource route POST → action', async () => {
    const route = makeRoute({
      path: '/api/users',
      pattern: /^\/api\/users\/?$/,
      componentPath: '/app/api/route.ts',
      isResource: true,
    })

    const handler = createRequestHandler({
      routes: [route],
      manifest: emptyManifest,
      requireModule: p => {
        if (p === '/app/api/route.ts') {
          return { action: () => ({ created: true }) }
        }
        return {}
      },
      clientEntry: [],
    })

    const req = mockReq('/api/users', 'POST')
    const res = mockRes()

    await handler(req, res)
    expect(res.jsonData).toEqual({ created: true })
  })

  it('returns 405 for resource route POST without action', async () => {
    const route = makeRoute({
      path: '/api/users',
      pattern: /^\/api\/users\/?$/,
      componentPath: '/app/api/route.ts',
      isResource: true,
    })

    const handler = createRequestHandler({
      routes: [route],
      manifest: emptyManifest,
      requireModule: () => ({ loader: () => [] }),
      clientEntry: [],
    })

    const req = mockReq('/api/users', 'POST')
    const res = mockRes()

    await handler(req, res)
    expect(res.statusCode).toBe(405)
  })

  it('handles redirect in data request', async () => {
    const route = makeRoute({
      loaderPath: '/app/redirect-loader.ts',
    })

    const handler = createRequestHandler({
      routes: [route],
      manifest: emptyManifest,
      requireModule: p => {
        if (p === '/app/redirect-loader.ts') {
          return {
            loader: () => {
              throw new ParetoRedirect('/target', 301)
            },
          }
        }
        return modules[p] ?? {}
      },
      clientEntry: [],
    })

    const req = mockReq('/__pareto/data', 'GET', { path: '/' })
    const res = mockRes()

    await handler(req, res)
    expect(res.jsonData).toEqual({ redirect: '/target', status: 301 })
  })

  it('handles loader that returns undefined (no loader)', async () => {
    const handler = createRequestHandler({
      routes: [makeRoute()],
      manifest: emptyManifest,
      requireModule: p => modules[p] ?? {},
      clientEntry: [],
    })

    const req = mockReq('/__pareto/data', 'GET', { path: '/' })
    const res = mockRes()

    await handler(req, res)
    expect(res.jsonData.loaderData).toBeUndefined()
  })

  it('runs page module loader when no separate loaderPath', async () => {
    const routeWithInlineLoader = makeRoute()

    const handler = createRequestHandler({
      routes: [routeWithInlineLoader],
      manifest: emptyManifest,
      requireModule: p => {
        if (p === '/app/page.tsx') {
          return {
            default: Page,
            loader: () => ({ inline: true }),
          }
        }
        return modules[p] ?? {}
      },
      clientEntry: [],
    })

    const req = mockReq('/__pareto/data', 'GET', { path: '/' })
    const res = mockRes()

    await handler(req, res)
    expect(res.jsonData.loaderData).toEqual({ inline: true })
  })
})
