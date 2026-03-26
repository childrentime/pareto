import { describe, it, expect } from 'vitest'
import { DeferredData, defer } from '../types'

describe('DeferredData', () => {
  it('should wrap data in DeferredData', () => {
    const data = { user: 'resolved', activity: Promise.resolve([]) }
    const deferred = new DeferredData(data)
    expect(deferred.data).toBe(data)
    expect(deferred).toBeInstanceOf(DeferredData)
  })
})

describe('defer()', () => {
  it('should return a DeferredData instance', () => {
    const result = defer({ name: 'test' })
    expect(result).toBeInstanceOf(DeferredData)
    expect(result.data.name).toBe('test')
  })

  it('should support mixed resolved and promise values', () => {
    const result = defer({
      resolved: 'value',
      pending: Promise.resolve('async'),
    })
    expect(result.data.resolved).toBe('value')
    expect(result.data.pending).toBeInstanceOf(Promise)
  })
})
