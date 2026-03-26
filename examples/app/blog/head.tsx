import type { HeadFunction } from '@paretojs/core'

export const head: HeadFunction = () => ({
  title: 'Blog | Pareto',
  meta: [
    {
      name: 'description',
      content: 'Dynamic routes, nested layouts, and static generation.',
    },
  ],
})
