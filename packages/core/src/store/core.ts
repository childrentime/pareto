import { produce } from 'immer'
import type { Draft } from 'immer'

export type StateCreator<T> = (
  setState: (updater: (draft: Draft<T>) => void) => void,
  getState: () => T,
) => T

export interface StoreApi<T> {
  setState: (updater: (draft: Draft<T>) => void) => void
  getState: () => T
  subscribe: (listener: (state: T, prevState: T) => void) => () => void
}

export function createStoreApi<T>(createState: StateCreator<T>): StoreApi<T> {
  type Listener = (state: T, prevState: T) => void
  let state: T
  const listeners = new Set<Listener>()

  const setState: StoreApi<T>['setState'] = (updater) => {
    const prev = state
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    state = produce(prev, updater) as T
    listeners.forEach((l) => l(state, prev))
  }

  const getState: StoreApi<T>['getState'] = () => state

  const subscribe: StoreApi<T>['subscribe'] = (listener) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }

  state = createState(setState, getState)
  return { setState, getState, subscribe }
}
