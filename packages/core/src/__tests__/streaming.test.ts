import { describe, it, expect } from 'vitest'
import { isDeferredData, serializeDeferredData } from '../data/streaming'
import { DeferredData } from '../types'

describe('isDeferredData', () => {
  it('should return true for DeferredData instances', () => {
    const deferred = new DeferredData({ key: 'value' })
    expect(isDeferredData(deferred)).toBe(true)
  })

  it('should return false for plain objects', () => {
    expect(isDeferredData({ key: 'value' })).toBe(false)
    expect(isDeferredData(null)).toBe(false)
    expect(isDeferredData(undefined)).toBe(false)
    expect(isDeferredData('string')).toBe(false)
  })
})

describe('serializeDeferredData', () => {
  it('should separate resolved values from pending promises', () => {
    const deferred = new DeferredData({
      user: { name: 'Alice' },
      activity: Promise.resolve([]),
      settings: Promise.resolve({}),
      count: 42,
    })

    const { resolved, pendingKeys } = serializeDeferredData(deferred)

    expect(resolved).toEqual({
      user: { name: 'Alice' },
      count: 42,
    })
    expect(pendingKeys).toContain('activity')
    expect(pendingKeys).toContain('settings')
    expect(pendingKeys).toHaveLength(2)
  })

  it('should handle all-resolved data', () => {
    const deferred = new DeferredData({ a: 1, b: 'hello' })
    const { resolved, pendingKeys } = serializeDeferredData(deferred)

    expect(resolved).toEqual({ a: 1, b: 'hello' })
    expect(pendingKeys).toEqual([])
  })

  it('should handle all-pending data', () => {
    const deferred = new DeferredData({
      a: Promise.resolve(1),
      b: Promise.resolve(2),
    })
    const { resolved, pendingKeys } = serializeDeferredData(deferred)

    expect(Object.keys(resolved)).toEqual([])
    expect(pendingKeys).toEqual(['a', 'b'])
  })
})
