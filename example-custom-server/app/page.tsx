import type { LoaderContext } from '@paretojs/core'
import { Link, useLoaderData } from '@paretojs/core'

interface HomeData {
  serverInfo: string
  features: { title: string; description: string }[]
}

export function loader({ res }: LoaderContext) {
  return {
    serverInfo: (res.getHeader('x-powered-by') as string) ?? 'unknown',
    features: [
      {
        title: 'Custom Middleware',
        description:
          'X-Powered-By and X-Request-Id headers added via Express middleware in app.ts.',
      },
      {
        title: 'Custom API Routes',
        description:
          '/custom-api/health and /custom-api/echo endpoints defined directly in Express.',
      },
      {
        title: 'Security Headers',
        description:
          'OWASP security headers applied via securityHeaders() from @paretojs/core/node.',
      },
    ],
  } satisfies HomeData
}

export default function HomePage() {
  const data = useLoaderData<HomeData>()

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold text-stone-900 mb-2">
        Custom Server Example
      </h1>
      <p className="text-stone-500 mb-8">
        This app uses a custom Express server defined in{' '}
        <code className="px-1.5 py-0.5 bg-stone-100 rounded text-sm font-mono">
          app.ts
        </code>
      </p>

      <div className="mb-8 p-4 rounded-lg border border-stone-200 bg-white">
        <div className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-1">
          Server Info
        </div>
        <div className="text-sm text-stone-900 font-mono">
          {data.serverInfo}
        </div>
      </div>

      <div className="space-y-4 mb-8">
        {data.features.map(f => (
          <div
            key={f.title}
            className="p-4 rounded-lg border border-stone-200 bg-white"
          >
            <h3 className="text-sm font-semibold text-stone-900 mb-1">
              {f.title}
            </h3>
            <p className="text-sm text-stone-500">{f.description}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        <Link
          href="/about"
          className="text-sm font-medium text-orange-700 hover:underline"
        >
          About page
        </Link>
        <a
          href="/custom-api/health"
          target="_blank"
          className="text-sm font-medium text-orange-700 hover:underline"
        >
          Health API
        </a>
        <a
          href="/custom-api/echo?hello=world"
          target="_blank"
          className="text-sm font-medium text-orange-700 hover:underline"
        >
          Echo API
        </a>
      </div>
    </div>
  )
}
