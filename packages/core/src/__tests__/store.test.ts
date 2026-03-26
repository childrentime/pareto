import { describe, it, expect, vi } from 'vitest'
import { createStoreApi } from '../store/core'
import { defineStore } from '../store/define-store'

describe('createStoreApi', () => {
  it('should create a store with initial state', () => {
    const store = createStoreApi((set, get) => ({
      count: 0,
      name: 'test',
    }))

    expect(store.getState()).toEqual({ count: 0, name: 'test' })
  })

  it('should update state via immer draft', () => {
    const store = createStoreApi((set, get) => ({
      count: 0,
      increment: () => set((d) => { d.count++ }),
    }))

    store.getState().increment()
    expect(store.getState().count).toBe(1)
  })

  it('should produce immutable updates', () => {
    const store = createStoreApi((set) => ({
      items: [1, 2, 3],
      push: (n: number) => set((d) => { d.items.push(n) }),
    }))

    const before = store.getState()
    store.getState().push(4)
    const after = store.getState()

    expect(before.items).toEqual([1, 2, 3])
    expect(after.items).toEqual([1, 2, 3, 4])
    expect(before.items).not.toBe(after.items)
  })

  it('should notify subscribers on state change', () => {
    const store = createStoreApi((set) => ({
      count: 0,
      increment: () => set((d) => { d.count++ }),
    }))

    const listener = vi.fn()
    store.subscribe(listener)

    store.getState().increment()

    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ count: 1 }),
      expect.objectContaining({ count: 0 }),
    )
  })

  it('should unsubscribe correctly', () => {
    const store = createStoreApi((set) => ({
      count: 0,
      increment: () => set((d) => { d.count++ }),
    }))

    const listener = vi.fn()
    const unsub = store.subscribe(listener)

    store.getState().increment()
    expect(listener).toHaveBeenCalledTimes(1)

    unsub()
    store.getState().increment()
    expect(listener).toHaveBeenCalledTimes(1) // not called again
  })

  it('should allow getState() inside set()', () => {
    const store = createStoreApi((set, get) => ({
      count: 0,
      double: () => set((d) => { d.count = get().count * 2 }),
    }))

    store.setState((d) => { d.count = 5 })
    store.getState().double()
    expect(store.getState().count).toBe(10)
  })
})

describe('defineStore', () => {
  it('should return destructurable { useStore, getState, setState, subscribe }', () => {
    const { useStore, getState, setState, subscribe } = defineStore((set) => ({
      count: 0,
      increment: () => set((d) => { d.count++ }),
    }))

    expect(typeof useStore).toBe('function')
    expect(typeof getState).toBe('function')
    expect(typeof setState).toBe('function')
    expect(typeof subscribe).toBe('function')
  })

  it('should support getState/setState outside React', () => {
    const { getState, setState } = defineStore((set) => ({
      value: 'hello',
      setValue: (v: string) => set((d) => { d.value = v }),
    }))

    expect(getState().value).toBe('hello')

    setState((d) => { d.value = 'world' })
    expect(getState().value).toBe('world')

    getState().setValue('foo')
    expect(getState().value).toBe('foo')
  })

  it('should support subscribe outside React', () => {
    const { getState, subscribe } = defineStore((set) => ({
      count: 0,
      increment: () => set((d) => { d.count++ }),
    }))

    const values: number[] = []
    subscribe((state) => values.push(state.count))

    getState().increment()
    getState().increment()

    expect(values).toEqual([1, 2])
  })
})
