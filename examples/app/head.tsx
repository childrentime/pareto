import type { HeadDescriptor } from '@paretojs/core'

export function head(): HeadDescriptor {
  return {
    title: 'Pareto — Lightweight React SSR Framework',
    meta: [
      {
        name: 'description',
        content:
          'SSR, streaming, file-based routing, state management — everything you need, nothing you don\'t.',
      },
    ],
  }
}
