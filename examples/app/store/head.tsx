import type { HeadDescriptor } from '@paretojs/core'

export function head(): HeadDescriptor {
  return {
    title: 'Store — Pareto',
    meta: [
      {
        name: 'description',
        content: 'Reactive state management with Immer-powered mutations.',
      },
    ],
  }
}
