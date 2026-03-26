import type { HeadFunction } from '@paretojs/core'

export const head: HeadFunction = () => ({
  title: 'SSR + Store | Pareto',
  meta: [
    {
      name: 'description',
      content:
        'Initialize stores with server-loaded data via defineContextStore.',
    },
  ],
})
