import { Link } from '@paretojs/core'

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold text-stone-900 mb-4">About</h1>
      <p className="text-stone-500 mb-6 leading-relaxed">
        This example demonstrates how to use a custom Express server with Pareto
        by creating an{' '}
        <code className="px-1.5 py-0.5 bg-stone-100 rounded text-sm font-mono">
          app.ts
        </code>{' '}
        file in your project root.
      </p>
      <p className="text-stone-500 mb-6 leading-relaxed">
        The custom server adds middleware, API routes, and security headers —
        all while Pareto handles SSR, routing, and hydration automatically.
      </p>
      <Link
        href="/"
        className="text-sm font-medium text-orange-700 hover:underline"
      >
        Back to Home
      </Link>
    </div>
  )
}
