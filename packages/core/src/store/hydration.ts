import type { StoreApi } from './core'

const HYDRATION_KEY = '__PARETO_DATA__'

export interface HydrationPayload {
  loaderData: Record<string, unknown>
  storeSnapshots: Record<string, unknown>
}

declare global {
  interface Window {
    __PARETO_DATA__?: HydrationPayload
  }
}

export function dehydrate(
  loaderData: Record<string, unknown>,
  stores?: Record<string, StoreApi<Record<string, unknown>>>,
): string {
  const payload: HydrationPayload = {
    loaderData,
    storeSnapshots: {},
  }

  if (stores) {
    for (const [name, store] of Object.entries(stores)) {
      payload.storeSnapshots[name] = store.getState()
    }
  }

  return `<script>window.${HYDRATION_KEY}=${JSON.stringify(payload).replace(/</g, '\\u003c')}</script>`
}

export function getHydrationData(): HydrationPayload | null {
  if (typeof window === 'undefined') return null
  return window.__PARETO_DATA__ ?? null
}

export function hydrateStores(
  stores: Record<string, StoreApi<Record<string, unknown>>>,
) {
  const data = getHydrationData()
  if (!data?.storeSnapshots) return

  for (const [name, store] of Object.entries(stores)) {
    const snapshot = data.storeSnapshots[name]
    if (snapshot) {
      store.setState(() => snapshot as Record<string, unknown>)
    }
  }
}
