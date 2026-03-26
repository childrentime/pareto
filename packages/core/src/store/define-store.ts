import { useDebugValue, useSyncExternalStore } from 'react'
import { createStoreApi } from './core'
import type { StateCreator, StoreApi } from './core'

type ExtractState<TStore> = TStore extends { getState: () => infer T }
  ? T
  : never

type UseBoundStore<TStore> = {
  (): ExtractState<TStore>
  <TSelected>(selector: (state: ExtractState<TStore>) => TSelected): TSelected
} & TStore

type WithDirectStateAccess<TStore> = TStore extends { getState: () => infer T }
  ? TStore & { use: { [K in keyof T]: T[K] } }
  : never

function createBoundStore<T>(api: StoreApi<T>) {
  const useBoundStore = (selector: any) => {
    const slice = useSyncExternalStore(
      api.subscribe,
      () => selector(api.getState()),
      () => selector(api.getState()),
    )
    useDebugValue(slice)
    return slice
  }

  Object.assign(useBoundStore, api)
  return useBoundStore as UseBoundStore<typeof api>
}

function createEnhancedStore<T>(createState: StateCreator<T>) {
  const store = createBoundStore(createStoreApi(createState))
  const state = store.getState() as object

  const useModel = Object.keys(state).reduce(
    (total, key) => {
      Object.defineProperty(total, key, {
        get() {
          return store((s) => s[key as keyof T])
        },
        enumerable: true,
      })
      return total
    },
    {} as { [K in keyof T]: T[K] },
  )

  ;(store as any).use = useModel
  return store as WithDirectStateAccess<typeof store>
}

export function defineStore<T extends object>(createState: StateCreator<T>) {
  const store = createEnhancedStore(createState)

  function useStore(): T {
    return store.use as T
  }

  return {
    useStore,
    subscribe: store.subscribe,
    getState: store.getState,
    setState: store.setState,
  }
}
