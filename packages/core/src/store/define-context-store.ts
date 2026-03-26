import {
  createContext,
  createElement,
  useContext,
  useDebugValue,
  useRef,
  useSyncExternalStore,
} from 'react'
import type { ReactNode } from 'react'
import { createStoreApi } from './core'
import type { StateCreator, StoreApi } from './core'

export function defineContextStore<T extends object, Init = void>(
  createState: (init: Init) => StateCreator<T>,
) {
  type Store = StoreApi<T>
  const StoreContext = createContext<Store | null>(null)

  function Provider({
    children,
    initialData,
  }: {
    children: ReactNode
    initialData: Init
  }) {
    const storeRef = useRef<Store | null>(null)
    if (storeRef.current === null) {
      storeRef.current = createStoreApi(createState(initialData))
    }
    return createElement(StoreContext.Provider, { value: storeRef.current }, children)
  }

  function useStoreApi(): Store {
    const store = useContext(StoreContext)
    if (!store) {
      throw new Error('useStore must be used within its Provider')
    }
    return store
  }

  function useStore(): T {
    const store = useStoreApi()
    const state = store.getState() as object

    const model = Object.keys(state).reduce(
      (total, key) => {
        Object.defineProperty(total, key, {
          get() {
            const slice = useSyncExternalStore(
              store.subscribe,
              () => store.getState()[key as keyof T],
              () => store.getState()[key as keyof T],
            )
            useDebugValue(slice)
            return slice
          },
          enumerable: true,
        })
        return total
      },
      {} as T,
    )

    return model
  }

  return { Provider, useStore, StoreContext }
}
