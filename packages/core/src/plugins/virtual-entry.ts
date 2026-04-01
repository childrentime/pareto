import fs from 'fs'
import path from 'path'
import type { Plugin, ViteDevServer } from 'vite'
import {
  generateServerEntry,
  generateUnifiedClientEntry,
  toImportPath,
} from '../entry/generate'
import {
  findDocument,
  findError,
  findNotFound,
  findRootHead,
  scanRoutes,
} from '../router/route-scanner'
import type { RouteDef, RouteManifest } from '../types'

export const VIRTUAL_SERVER_ENTRY = 'virtual:pareto/server-entry'
export const VIRTUAL_CLIENT_ENTRY = 'virtual:pareto/client-entry'

const RESOLVED_SERVER = '\0' + VIRTUAL_SERVER_ENTRY

/**
 * Find global CSS files at the app root level.
 */
export function findGlobalCss(appDir: string): string[] {
  const candidates = [
    'globals.css',
    'global.css',
    'globals.scss',
    'global.scss',
  ]
  return candidates.map(f => path.join(appDir, f)).filter(f => fs.existsSync(f))
}

function toRootRelativeUrl(filePath: string): string {
  return '/' + toImportPath(path.relative(process.cwd(), filePath))
}

export interface VirtualEntryOptions {
  appDir: string
  globalCssPaths?: string[]
  isDev?: boolean
  /** Client entry JS URLs (from Vite manifest, for production builds) */
  clientEntryUrls?: string[]
  /** CSS URLs to inject (from Vite manifest, for production builds) */
  cssUrls?: string[]
  /** Per-route JS/CSS manifest (from Vite manifest, for production builds) */
  routeManifest?: RouteManifest
  /** Forward wkWebViewFlushHint from ParetoConfig */
  wkWebViewFlushHint?: boolean
}

/**
 * Vite plugin that provides virtual modules for server and client entries.
 * Replaces physical file generation (.pareto/entry/) with on-demand code
 * generation via Vite's plugin load hook.
 */
export function paretoVirtualEntry(options: VirtualEntryOptions): Plugin {
  const {
    appDir,
    globalCssPaths = [],
    isDev = false,
    clientEntryUrls: optClientEntryUrls,
    cssUrls: optCssUrls,
    routeManifest: optRouteManifest,
    wkWebViewFlushHint = false,
  } = options
  let routes: RouteDef[] = []
  let notFoundPath: string | undefined
  let errorPath: string | undefined
  let rootHeadPath: string | undefined
  let documentPath: string | undefined

  function rescanRoutes() {
    routes = scanRoutes(appDir)
    notFoundPath = findNotFound(appDir)
    errorPath = findError(appDir)
    rootHeadPath = findRootHead(appDir)
    documentPath = findDocument(appDir)
  }

  return {
    name: 'pareto:virtual-entry',
    enforce: 'pre',

    buildStart() {
      rescanRoutes()
    },

    resolveId(id) {
      // Strip leading / from browser URL requests
      const cleanId = id.startsWith('/') ? id.slice(1) : id
      if (cleanId === VIRTUAL_SERVER_ENTRY) return RESOLVED_SERVER
      // Client entry: no \0 prefix so the browser can request it directly
      if (cleanId === VIRTUAL_CLIENT_ENTRY) return VIRTUAL_CLIENT_ENTRY
    },

    load(id) {
      if (id === RESOLVED_SERVER) {
        const clientEntryUrls = isDev
          ? ['/@vite/client', '/' + VIRTUAL_CLIENT_ENTRY]
          : (optClientEntryUrls ?? [])

        const cssUrls = isDev
          ? globalCssPaths.map(toRootRelativeUrl)
          : (optCssUrls ?? [])

        return generateServerEntry({
          routes,
          clientEntryUrls,
          globalCssPaths,
          cssUrls,
          notFoundPath,
          errorPath,
          rootHeadPath,
          documentPath,
          routeManifest: optRouteManifest,
          wkWebViewFlushHint,
        })
      }

      if (id === VIRTUAL_CLIENT_ENTRY) {
        return generateUnifiedClientEntry(
          routes,
          globalCssPaths,
          notFoundPath,
          errorPath,
        )
      }
    },

    configureServer(server: ViteDevServer) {
      // Watch for route structure changes (file add/remove)
      let debounceTimer: ReturnType<typeof setTimeout> | null = null

      server.watcher.on('all', (event, filePath) => {
        if (!filePath.startsWith(appDir)) return
        if (event !== 'add' && event !== 'unlink') return

        // Debounce to handle bulk file operations (e.g., git checkout)
        if (debounceTimer) clearTimeout(debounceTimer)
        debounceTimer = setTimeout(() => {
          rescanRoutes()

          const serverMod = server.moduleGraph.getModuleById(RESOLVED_SERVER)
          if (serverMod) server.moduleGraph.invalidateModule(serverMod)

          const clientMod =
            server.moduleGraph.getModuleById(VIRTUAL_CLIENT_ENTRY)
          if (clientMod) server.moduleGraph.invalidateModule(clientMod)

          server.hot.send({ type: 'full-reload' })
        }, 100)
      })
    },
  }
}
