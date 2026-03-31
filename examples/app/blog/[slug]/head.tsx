import type { HeadProps } from '@paretojs/core'

export default function Head({ loaderData }: HeadProps) {
  const post = (loaderData as { post?: { title?: string; content?: string } })
    ?.post
  return (
    <>
      <title>{post?.title ?? 'Post'} | Pareto Blog</title>
      <meta name="description" content={post?.content?.slice(0, 160) ?? ''} />
    </>
  )
}
