import type { ReactElement } from 'react'
import { createElement, Fragment, isValidElement } from 'react'
import { describe, expect, it } from 'vitest'
import { HEAD_ATTR } from '../head/constants'
import { resolveServerHead } from '../head/server-head'
import type { RouteDef } from '../types'
import { DeferredData } from '../types'

function makeRoute(headPaths: string[]): RouteDef {
  return {
    path: '/',
    pattern: /^\/$/,
    paramNames: [],
    segments: [],
    componentPath: '/app/page.tsx',
    layoutPaths: [],
    headPaths,
    isDynamic: false,
    isCatchAll: false,
    isResource: false,
  }
}

function makeModules(modules: Record<string, unknown>) {
  return (path: string) => modules[path] ?? {}
}

describe('resolveServerHead', () => {
  it('returns null when route has no headPaths', () => {
    const route = makeRoute([])
    const result = resolveServerHead(route, {}, {}, makeModules({}))
    expect(result).toBeNull()
  })

  it('renders single head component with data-pareto-head marker', () => {
    const Head = ({ loaderData, params }: any) =>
      createElement(Fragment, null, createElement('title', null, 'Test'))

    const route = makeRoute(['/head.tsx'])
    const result = resolveServerHead(
      route,
      { title: 'Test' },
      {},
      makeModules({ '/head.tsx': { default: Head } }),
    )

    expect(isValidElement(result)).toBe(true)
    const el = result as ReactElement<Record<string, unknown>>
    expect(el.props[HEAD_ATTR]).toBe('')
  })

  it('deduplicates title across parent and child head components', () => {
    const ParentHead = () =>
      createElement(Fragment, null, createElement('title', null, 'Root'))

    const ChildHead = () =>
      createElement(Fragment, null, createElement('title', null, 'Page'))

    const route = makeRoute(['/root-head.tsx', '/child-head.tsx'])
    const result = resolveServerHead(
      route,
      {},
      {},
      makeModules({
        '/root-head.tsx': { default: ParentHead },
        '/child-head.tsx': { default: ChildHead },
      }),
    )

    expect(isValidElement(result)).toBe(true)
    const el = result as ReactElement
    expect(el.props.children).toBe('Page')
  })

  it('passes loaderData and params to head components', () => {
    let receivedProps: any
    const Head = (props: any) => {
      receivedProps = props
      return createElement('title', null, 'Hi')
    }

    const route = makeRoute(['/head.tsx'])
    resolveServerHead(
      route,
      { user: 'Alice' },
      { slug: 'test' },
      makeModules({ '/head.tsx': { default: Head } }),
    )

    expect(receivedProps.loaderData).toEqual({ user: 'Alice' })
    expect(receivedProps.params).toEqual({ slug: 'test' })
  })

  it('unwraps DeferredData for head components', () => {
    let receivedData: any
    const Head = (props: any) => {
      receivedData = props.loaderData
      return createElement('title', null, 'Deferred')
    }

    const deferred = new DeferredData({
      user: 'Bob',
      activity: Promise.resolve([]),
    })
    const route = makeRoute(['/head.tsx'])
    resolveServerHead(
      route,
      deferred,
      {},
      makeModules({ '/head.tsx': { default: Head } }),
    )

    expect(receivedData).toEqual({ user: 'Bob', activity: expect.any(Promise) })
  })

  it('returns null when head components produce no elements', () => {
    const Head = () => null
    const route = makeRoute(['/head.tsx'])
    const result = resolveServerHead(
      route,
      {},
      {},
      makeModules({ '/head.tsx': { default: Head } }),
    )
    expect(result).toBeNull()
  })

  it('skips modules without default export', () => {
    const route = makeRoute(['/head.tsx'])
    const result = resolveServerHead(
      route,
      {},
      {},
      makeModules({ '/head.tsx': {} }),
    )
    expect(result).toBeNull()
  })

  it('wraps multiple elements in Fragment', () => {
    const Head = () =>
      createElement(
        Fragment,
        null,
        createElement('title', null, 'Title'),
        createElement('meta', { name: 'description', content: 'desc' }),
      )

    const route = makeRoute(['/head.tsx'])
    const result = resolveServerHead(
      route,
      {},
      {},
      makeModules({ '/head.tsx': { default: Head } }),
    )

    expect(isValidElement(result)).toBe(true)
    const el = result as ReactElement
    expect(el.type).toBe(Fragment)
  })
})
