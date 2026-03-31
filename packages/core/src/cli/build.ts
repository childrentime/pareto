import fs from 'fs'
import path from 'path'
import { findAppFile } from '../config/app'
import { loadConfig, resolveAppDir, resolveOutDir } from '../config/load'
import { toImportPath } from '../entry/generate'
import {
  findGlobalCss,
  paretoVirtualEntry,
  VIRTUAL_CLIENT_ENTRY,
  VIRTUAL_SERVER_ENTRY,
} from '../plugins/virtual-entry'
import { scanRoutes } from '../router/route-scanner'
import type { RouteDef, RouteManifest } from '../types'

export async function build() {
  const cwd = process.cwd()
  const config = await loadConfig(cwd)
  const appDir = resolveAppDir(config, cwd)
  const outDir = resolveOutDir(config, cwd)

  // Clean output directory
  if (fs.existsSync(outDir)) {
    fs.rmSync(outDir, { recursive: true })
  }
  fs.mkdirSync(outDir, { recursive: true })

  // Scan routes for logging
  const routes = scanRoutes(appDir)
  const globalCssPaths = findGlobalCss(appDir)
  const clientOutputPath = path.resolve(outDir, 'client')
  const serverOutputPath = path.resolve(outDir, 'server')

  console.log(`[pareto] Building for production...`)
  console.log(`[pareto] Found ${routes.length} route(s)`)

  // Dynamic import to avoid CJS→ESM warning (vite is pure ESM)
  const { build: viteBuild } = await import('vite')
  const { createClientConfig, createServerConfig } = await import(
    '../config/vite'
  )

  // 1. Client build
  console.log(`[pareto] Building client...`)
  await viteBuild(
    createClientConfig({
      root: cwd,
      outDir: clientOutputPath,
      entry: VIRTUAL_CLIENT_ENTRY,
      config,
      plugins: [
        paretoVirtualEntry({
          appDir,
          globalCssPaths,
          isDev: false,
          wkWebViewFlushHint: config.wkWebViewFlushHint,
        }),
      ],
    }),
  )

  // 2. Read Vite manifest to get client entry URLs and per-route chunks
  const { clientEntryUrls, cssUrls, routeManifest } = readViteManifest(
    clientOutputPath,
    routes,
    cwd,
  )

  // 3. Server build (SSR) — with client entry URLs from manifest
  console.log(`[pareto] Building server...`)
  await viteBuild(
    createServerConfig({
      root: cwd,
      outDir: serverOutputPath,
      entry: VIRTUAL_SERVER_ENTRY,
      config,
      plugins: [
        paretoVirtualEntry({
          appDir,
          globalCssPaths,
          isDev: false,
          clientEntryUrls,
          cssUrls,
          routeManifest,
          wkWebViewFlushHint: config.wkWebViewFlushHint,
        }),
      ],
    }),
  )

  // 4. Copy public directory
  const publicDir = path.resolve(cwd, 'public')
  const staticDir = path.resolve(outDir, 'static')
  if (fs.existsSync(publicDir)) {
    fs.cpSync(publicDir, staticDir, { recursive: true })
  }

  // 5. Write production server entry (with optional app.ts support)
  const appFilePath = findAppFile(cwd)
  writeProductionServer(outDir, appFilePath)

  console.log(`[pareto] Build complete. Output: ${outDir}`)
  console.log(`[pareto] Run 'pareto start' to start the production server.`)
}

interface ViteManifestEntry {
  file: string
  css?: string[]
  isEntry?: boolean
  imports?: string[]
}

type ViteManifestMap = Record<string, ViteManifestEntry>

/**
 * Recursively collect all transitive JS imports for a manifest entry.
 * This ensures modulepreload covers the full dependency graph.
 */
function collectTransitiveImports(
  manifest: ViteManifestMap,
  entryKey: string,
  visited: Set<string> = new Set<string>(),
): string[] {
  if (visited.has(entryKey)) return []
  visited.add(entryKey)

  const entry = manifest[entryKey]
  if (!entry) return []

  const files: string[] = []
  for (const importKey of entry.imports ?? []) {
    const imported = manifest[importKey]
    if (!imported) continue
    files.push('/' + imported.file)
    files.push(...collectTransitiveImports(manifest, importKey, visited))
  }
  return files
}

/**
 * Read the Vite manifest to extract client entry URLs and per-route chunk URLs.
 */
function readViteManifest(
  clientOutputPath: string,
  routes: RouteDef[],
  cwd: string,
): {
  clientEntryUrls: string[]
  cssUrls: string[]
  routeManifest: RouteManifest
} {
  const emptyManifest: RouteManifest = { routes: {} }
  const manifestPath = path.resolve(clientOutputPath, '.vite/manifest.json')
  if (!fs.existsSync(manifestPath)) {
    console.warn(
      '[pareto] Vite manifest not found, client entry URLs will be empty',
    )
    return { clientEntryUrls: [], cssUrls: [], routeManifest: emptyManifest }
  }

  const manifest = JSON.parse(
    fs.readFileSync(manifestPath, 'utf-8'),
  ) as ViteManifestMap

  // Find the client entry in the manifest
  const entryKey = Object.keys(manifest).find(
    k => k.includes('client-entry') || manifest[k].isEntry,
  )
  if (!entryKey) {
    console.warn('[pareto] Client entry not found in manifest')
    return { clientEntryUrls: [], cssUrls: [], routeManifest: emptyManifest }
  }

  const entry = manifest[entryKey]
  const clientEntryUrls = ['/' + entry.file]
  const cssUrls = (entry.css ?? []).map(c => '/' + c)

  // Build per-route manifest from Vite chunk info
  const routeManifest: RouteManifest = { routes: {} }
  for (const route of routes) {
    if (route.isResource) continue

    // Convert absolute component path to project-relative for manifest lookup
    const relPath = toImportPath(path.relative(cwd, route.componentPath))
    const chunkInfo = manifest[relPath]

    const js = chunkInfo
      ? ['/' + chunkInfo.file, ...collectTransitiveImports(manifest, relPath)]
      : undefined
    const routeCss = chunkInfo?.css?.map(c => '/' + c)

    routeManifest.routes[route.path] = {
      path: route.path,
      paramNames: route.paramNames,
      hasLoader: !!route.loaderPath,
      hasHead: route.headPaths.length > 0,
      js,
      css: routeCss,
    }
  }

  return { clientEntryUrls, cssUrls, routeManifest }
}

function writeProductionServer(outDir: string, appFilePath?: string) {
  const appArg = appFilePath ? `, '${toImportPath(appFilePath)}'` : ''

  const serverScript = `#!/usr/bin/env node
var { startProductionServer } = require('@paretojs/core/node');
startProductionServer(__dirname${appArg});
`
  fs.writeFileSync(path.resolve(outDir, 'index.js'), serverScript)
}
