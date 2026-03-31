import type { LoaderContext } from '@paretojs/core'

export function loader(_ctx: LoaderContext) {
  return {
    timestamp: new Date().toISOString(),
    data: Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      key: `item-${i + 1}`,
      value: Math.random(),
    })),
  }
}
