import type { LoaderContext } from '@paretojs/core'
import { useLoaderData } from '@paretojs/core'

// Loader runs on the server only — can read server-only process.env vars.
export function loader(_ctx: LoaderContext) {
  return {
    // Server reads server-only var from process.env
    serverSideApiSecret: process.env.API_SECRET ?? 'undefined',
    serverSideDatabaseUrl: process.env.DATABASE_URL ?? 'undefined',
    // Server can also read PARETO_ vars from process.env
    serverSidePretoApiUrl: process.env.PARETO_API_URL ?? 'undefined',
  }
}

interface LoaderData {
  serverSideApiSecret: string
  serverSideDatabaseUrl: string
  serverSidePretoApiUrl: string
}

export default function EnvTestPage() {
  const data = useLoaderData<LoaderData>()

  // Client reads PARETO_ vars via import.meta.env (inlined at build time).
  // Server-only vars (API_SECRET, DATABASE_URL) are NOT present on
  // import.meta.env — they would render as "undefined".
  const clientSideApiUrl = import.meta.env.PARETO_API_URL ?? 'undefined'
  const clientSideAppName = import.meta.env.PARETO_APP_NAME ?? 'undefined'
  // These should be undefined on the client — Vite does not expose
  // unprefixed vars to import.meta.env.
  const clientSideApiSecret =
    (import.meta.env as Record<string, string | undefined>).API_SECRET ??
    'undefined'
  const clientSideDatabaseUrl =
    (import.meta.env as Record<string, string | undefined>).DATABASE_URL ??
    'undefined'

  return (
    <div>
      <h1>Env Test</h1>

      <section>
        <h2>Server-side (loader, process.env)</h2>
        <p data-testid="server-api-secret">
          API_SECRET: {data.serverSideApiSecret}
        </p>
        <p data-testid="server-database-url">
          DATABASE_URL: {data.serverSideDatabaseUrl}
        </p>
        <p data-testid="server-pareto-api-url">
          PARETO_API_URL: {data.serverSidePretoApiUrl}
        </p>
      </section>

      <section>
        <h2>Client-side (import.meta.env)</h2>
        <p data-testid="client-api-url">PARETO_API_URL: {clientSideApiUrl}</p>
        <p data-testid="client-app-name">
          PARETO_APP_NAME: {clientSideAppName}
        </p>
        <p data-testid="client-api-secret">API_SECRET: {clientSideApiSecret}</p>
        <p data-testid="client-database-url">
          DATABASE_URL: {clientSideDatabaseUrl}
        </p>
      </section>
    </div>
  )
}
