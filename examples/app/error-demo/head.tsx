import type { HeadDescriptor } from '@paretojs/core'

export function head(): HeadDescriptor {
  return {
    title: 'Error Handling — Pareto',
    meta: [
      { name: 'description', content: 'Automatic error boundaries for loaders and components.' },
    ],
  }
}
