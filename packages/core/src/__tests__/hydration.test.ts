import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createStoreApi } from '../store/core'
import { dehydrate, getHydrationData, hydrateStores } from '../store/hydration'

describe('dehydrate', () => {
  it('should serialize loader data', () => {
    const html = dehydrate({ '/home': { count: 42 } })
    expect(html).toContain('window.__PARETO_DATA__=')
    expect(html).toContain('"loaderData"')
    expect(html).toContain('42')
  })

  it('should serialize store snapshots', () => {
    const store = createStoreApi(() => ({ count: 10, name: 'test' }))
    const html = dehydrate({}, { myStore: store })
    expect(html).toContain('"storeSnapshots"')
    expect(html).toContain('"myStore"')
    expect(html).toContain('10')
  })

  it('should escape < characters to prevent XSS', () => {
    const html = dehydrate({ data: '<script>alert("xss")</script>' })
    expect(html).not.toContain('<script>alert')
    expect(html).toContain('\\u003c')
  })
})

describe('getHydrationData', () => {
  beforeEach(() => {
    delete (globalThis as any).__PARETO_DATA__
  })

  it('should return null when no data exists', () => {
    // In a test environment, window is undefined
    expect(getHydrationData()).toBeNull()
  })
})

describe('hydrateStores', () => {
  beforeEach(() => {
    delete (globalThis as any).__PARETO_DATA__
  })

  it('should not throw when no hydration data exists', () => {
    const store = createStoreApi(() => ({ count: 0 }))
    expect(() => hydrateStores({ test: store })).not.toThrow()
  })
})
