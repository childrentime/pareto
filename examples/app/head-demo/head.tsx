import type { HeadDescriptor } from '@paretojs/core'

export function head(): HeadDescriptor {
  return {
    title: 'Head Management — Pareto',
    meta: [
      {
        name: 'description',
        content: 'Per-route title and meta tags via head.tsx with automatic merging.',
      },
      {
        property: 'og:type',
        content: 'website',
      },
    ],
  }
}
