import type { Application } from 'express'
import express from 'express'
import path from 'path'
import { loadEnv } from '../config/env'
import { securityHeaders } from './security-headers'

export interface ProductionServerOptions {
  outDir: string
  customApp?: Application
}

export function createProductionServer(options: ProductionServerOptions) {
  const { outDir, customApp } = options

  const app = customApp ?? express()
  const hasCustomApp = !!customApp

  if (!hasCustomApp) {
    app.use(securityHeaders())
  }

  try {
    const compression = require('compression') as () => express.RequestHandler
    app.use(compression())
  } catch {
    // compression package is optional
  }

  app.use(
    '/assets',
    express.static(path.join(outDir, 'client/assets'), {
      maxAge: '1y',
      immutable: true,
    }),
  )

  app.use('/', express.static(path.join(outDir, 'client')))
  app.use('/', express.static(path.join(outDir, 'static')))

  const serverBundle = require(path.join(outDir, 'server/index.js')) as Record<
    string,
    unknown
  >
  const handler = (serverBundle.default ??
    serverBundle) as express.RequestHandler
  if (typeof handler === 'function') {
    app.use('/', (req, res, next) => handler(req, res, next))
  }

  return app
}

export function startProductionServer(outDir: string, appFilePath?: string) {
  loadEnv(process.cwd(), process.env.NODE_ENV ?? 'production')

  const PORT = Number(process.env.PORT ?? 3000)
  let customApp: Application | undefined

  if (appFilePath) {
    try {
      const userMod = require(appFilePath) as Record<string, unknown>
      const resolved = (userMod.default ?? userMod) as unknown
      if (typeof resolved === 'function') {
        customApp = resolved as Application
      }
    } catch {
      console.warn(
        '[pareto] Failed to load app file, using default Express app',
      )
    }
  }

  const app = createProductionServer({ outDir, customApp })

  const server = app.listen(PORT, () => {
    console.log(
      `[pareto] Production server running at http://localhost:${PORT}`,
    )
  })

  function shutdown(signal: string) {
    console.log(`[pareto] ${signal} received, shutting down gracefully...`)
    server.close(() => {
      console.log('[pareto] Server closed.')
      process.exit(0)
    })
    setTimeout(() => {
      console.error('[pareto] Forced shutdown after timeout.')
      process.exit(1)
    }, 10000)
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
}
