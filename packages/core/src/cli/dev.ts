import express from 'express'
import http from 'http'
import net from 'net'
import path from 'path'
import { loadApp } from '../config/app'
import { loadConfig, resolveAppDir } from '../config/load'
import {
  findGlobalCss,
  paretoVirtualEntry,
  VIRTUAL_SERVER_ENTRY,
} from '../plugins/virtual-entry'
import { securityHeaders } from '../server/security-headers'

/** Check whether a port is available. */
export function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer()
    server.once('error', () => resolve(false))
    server.once('listening', () => {
      server.close(() => resolve(true))
    })
    server.listen(port)
  })
}

/** Find the first available port starting from `start`. */
export async function findAvailablePort(start: number): Promise<number> {
  let port = start
  while (!(await isPortAvailable(port))) {
    port++
  }
  return port
}

export async function dev() {
  const cwd = process.cwd()
  const config = await loadConfig(cwd)
  const appDir = resolveAppDir(config, cwd)
  const preferredPort = Number(process.env.PORT ?? 3000)
  const port = await findAvailablePort(preferredPort)

  const globalCssPaths = findGlobalCss(appDir)

  // Use user's custom Express app if app.ts exists, otherwise create default
  const userApp = await loadApp(cwd)
  const app = userApp ?? express()

  // Create HTTP server first so Vite HMR WebSocket can share it
  // (avoids "Port 24678 is already in use" when another Vite instance runs)
  const httpServer = http.createServer(app)

  // Dynamic import to avoid CJS→ESM warning (vite is pure ESM)
  const { createServer: createViteServer } = await import('vite')

  // Resolve @paretojs/core source aliases and load React plugin
  const { getCoreSourceAliases, loadReactPlugin } = await import(
    '../config/vite'
  )
  const aliases = getCoreSourceAliases()

  // Pareto's internal Vite config. This is merged with the user's
  // vite.config.ts (loaded automatically by Vite from the project root).
  // Users customize Vite via standard vite.config.ts — no framework hook needed.
  const paretoConfig = {
    server: {
      middlewareMode: true as const,
      hmr: { server: httpServer },
    },
    plugins: [
      loadReactPlugin(),
      paretoVirtualEntry({
        appDir,
        globalCssPaths,
        isDev: true,
        wkWebViewFlushHint: config.wkWebViewFlushHint,
      }),
    ],
    resolve: { alias: aliases },
    appType: 'custom' as const,
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-dom/server', 'react-dom/client'],
    },
    ssr: {
      noExternal: [/^@paretojs\//],
    },
  }

  // Create Vite dev server — Vite auto-loads vite.config.ts from root
  // and merges it with our inline config.
  const vite = await createViteServer({ ...paretoConfig, root: cwd })

  // Security headers (applied after user middleware so user can override)
  if (!userApp) {
    app.use(securityHeaders())
  }

  // Vite dev middleware handles HMR, module serving, etc.
  app.use(vite.middlewares)

  // Serve static files
  app.use('/', express.static(path.join(cwd, 'public')))

  // SSR handler — uses Vite's ssrLoadModule for hot-reloading
  app.use(async (req, res, next) => {
    if (req.url.startsWith('/@') || req.url.startsWith('/__vite')) {
      return next()
    }
    try {
      const serverModule = (await vite.ssrLoadModule(VIRTUAL_SERVER_ENTRY)) as {
        default?: unknown
      }
      const handler = serverModule.default

      if (typeof handler === 'function') {
        await (
          handler as (
            req: unknown,
            res: unknown,
            next: () => void,
          ) => Promise<void>
        )(req, res, next)
      } else {
        next()
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        vite.ssrFixStacktrace(err)
      }
      console.error('[pareto] SSR error:', err)
      next(err)
    }
  })

  if (port !== preferredPort) {
    console.log(
      `[pareto] Port ${preferredPort} is in use, using ${port} instead`,
    )
  }
  console.log(`[pareto] Dev server starting...`)
  httpServer.listen(port, () => {
    console.log(`[pareto] Dev server running at http://localhost:${port}`)
  })
}
