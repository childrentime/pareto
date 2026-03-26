import type { HeadFunction } from '@paretojs/core'

export const head: HeadFunction = ({ loaderData }) => ({
  title: `${loaderData?.post?.title ?? 'Post'} | Pareto Blog`,
  meta: [
    {
      name: 'description',
      content: loaderData?.post?.content?.slice(0, 160) ?? '',
    },
  ],
})
