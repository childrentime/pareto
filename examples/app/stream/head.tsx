import type { HeadDescriptor } from '@paretojs/core'

export function head(): HeadDescriptor {
  return {
    title: 'Streaming SSR — Pareto',
    meta: [
      {
        name: 'description',
        content:
          'Watch deferred data stream in progressively as each promise resolves.',
      },
    ],
  }
}
