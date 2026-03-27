import fs from 'fs'
import path from 'path'
import {
  findAppFile,
  loadConfig,
  resolveAppDir,
  resolveOutDir,
} from '../config'
import { scanRoutes } from '../entry'
import {
  findGlobalCss,
  paretoVirtualEntry,
  VIRTUAL_CLIENT_ENTRY,
  VIRTUAL_SERVER_ENTRY,
} from '../plugins/virtual-entry'
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
      plugins: [paretoVirtualEntry({ appDir, globalCssPaths, isDev: false })],
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
        }),
      ],
    }),
  )

  // 4. Copy public directory
  const publicDir = path.resolve(cwd, 'public')
  const staticDir = path.resolve(outDir, 'static')
  if (fs.existsSync(publicDir)) {
    copyDirSync(publicDir, staticDir)
  }

  // 5. Write production server entry (with optional app.ts support)
  const appFilePath = findAppFile(cwd)
  writeProductionServer(outDir, appFilePath)

  // 6. Static site generation (SSG)
  await generateStaticPages(serverOutputPath, clientOutputPath)

  console.log(`[pareto] Build complete. Output: ${outDir}`)
  console.log(`[pareto] Run 'pareto start' to start the production server.`)
}

function copyDirSync(src: string, dest: string) {
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

interface ViteManifestEntry {
  file: string
  css?: string[]
  isEntry?: boolean
  imports?: string[]
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

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as Record<
    string,
    ViteManifestEntry
  >

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
    const relPath = path.relative(cwd, route.componentPath).replace(/\\/g, '/')
    const chunkInfo = manifest[relPath]

    const js = chunkInfo ? ['/' + chunkInfo.file] : undefined
    const routeCss = chunkInfo?.css?.map(c => '/' + c)

    routeManifest.routes[route.path] = {
      path: route.path,
      paramNames: route.paramNames,
      hasLoader: !!route.loaderPath,
      hasHead: !!route.headPath || route.headPaths.length > 0,
      js,
      css: routeCss,
    }
  }

  return { clientEntryUrls, cssUrls, routeManifest }
}

/**
 * Static site generation: render static routes to HTML files.
 */
async function generateStaticPages(
  serverOutputPath: string,
  clientOutputPath: string,
): Promise<void> {
  const serverEntry = path.resolve(serverOutputPath, 'index.js')
  if (!fs.existsSync(serverEntry)) return

  // Load the compiled server bundle
  const serverBundle = require(serverEntry) as {
    default?: (req: unknown, res: unknown, next?: () => void) => Promise<void>
    __routes?: { path: string; componentPath: string; isDynamic: boolean }[]
    __moduleMap?: Record<
      string,
      {
        config?: { render?: string }
        staticParams?: () => Promise<Record<string, string>[]>
      }
    >
  }

  const routes = serverBundle.__routes
  const moduleMap = serverBundle.__moduleMap
  const handler = serverBundle.default

  if (!routes || !moduleMap || !handler) return

  // Collect paths to render statically
  const staticPaths: string[] = []

  for (const route of routes) {
    const pageMod = moduleMap[route.componentPath] as
      | {
          config?: { render?: string }
          staticParams?: () => Promise<Record<string, string>[]>
        }
      | undefined
    if (!pageMod?.config || pageMod.config.render !== 'static') continue

    if (route.isDynamic && pageMod.staticParams) {
      // Dynamic route with staticParams
      const paramSets = await pageMod.staticParams()
      for (const params of paramSets) {
        let urlPath = route.path
        for (const [key, value] of Object.entries(params)) {
          urlPath = urlPath.replace(`:${key}`, value)
        }
        staticPaths.push(urlPath)
      }
    } else if (!route.isDynamic) {
      staticPaths.push(route.path)
    }
  }

  if (staticPaths.length === 0) return

  console.log(`[pareto] Generating ${staticPaths.length} static page(s)...`)

  const { PassThrough } = await import('stream')

  for (const urlPath of staticPaths) {
    const html = await new Promise<string>((resolve, reject) => {
      const chunks: Buffer[] = []
      const stream = new PassThrough()

      stream.on('data', (chunk: Buffer) => chunks.push(chunk))
      stream.on('end', () => resolve(Buffer.concat(chunks).toString()))
      stream.on('error', reject)

      // Mock Express-like req/res
      const req = {
        path: urlPath,
        method: 'GET',
        headers: {},
        query: {},
      }

      const res = Object.assign(stream, {
        statusCode: 200,
        setHeader() {
          return res
        },
      })

      void handler(req, res).catch(reject)
    })

    // Write to client output directory
    const outputPath =
      urlPath === '/'
        ? path.resolve(clientOutputPath, 'index.html')
        : path.resolve(clientOutputPath, urlPath.slice(1), 'index.html')

    fs.mkdirSync(path.dirname(outputPath), { recursive: true })
    fs.writeFileSync(outputPath, html)
    console.log(
      `[pareto]   ${urlPath} → ${path.relative(process.cwd(), outputPath)}`,
    )
  }
}

function writeProductionServer(outDir: string, appFilePath?: string) {
  // If user has an app.ts/app.js, load it to get a custom Express app
  const appSetup = appFilePath
    ? `
// Load user's custom Express app
try {
  const userApp = require('${appFilePath.replace(/\\/g, '/')}');
  const customApp = userApp.default || userApp;
  if (typeof customApp === 'function') {
    app = customApp;
    hasCustomApp = true;
  }
} catch (_e) {
  console.warn('[pareto] Failed to load app file, using default Express app');
}
`
    : ''

  const serverScript = `#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const express = require('express');

// Load .env files (production mode)
(function loadEnv() {
  const cwd = process.cwd();
  const mode = process.env.NODE_ENV || 'production';
  const files = ['.env', '.env.local', '.env.' + mode, '.env.' + mode + '.local'];
  files.forEach(function(file) {
    const p = path.resolve(cwd, file);
    try {
      if (!fs.existsSync(p)) return;
      fs.readFileSync(p, 'utf-8').split('\\n').forEach(function(line) {
        line = line.trim();
        if (!line || line[0] === '#') return;
        var eq = line.indexOf('=');
        if (eq === -1) return;
        var key = line.slice(0, eq).trim();
        var val = line.slice(eq + 1).trim();
        if ((val[0] === '"' || val[0] === "'") && val[val.length - 1] === val[0]) val = val.slice(1, -1);
        if (!(key in process.env)) process.env[key] = val;
      });
    } catch (_e) {}
  });
})();

const PORT = process.env.PORT || 3000;
var app = express();
var hasCustomApp = false;
const outDir = __dirname;
${appSetup}
// Security headers (skip if user provides custom app — they manage their own middleware)
if (!hasCustomApp) {
  app.use(function(_req, res, next) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'interest-cohort=()');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('X-DNS-Prefetch-Control', 'off');
    next();
  });
}

// Gzip compression
try {
  const compression = require('compression');
  app.use(compression());
} catch (_e) {
  // compression package is optional — install it for gzip support
}

// Serve static assets with long-lived cache headers
app.use('/assets', express.static(path.join(outDir, 'client/assets'), {
  maxAge: '1y',
  immutable: true,
}));

// Serve client files
app.use('/', express.static(path.join(outDir, 'client')));

// Serve public static files
app.use('/', express.static(path.join(outDir, 'static')));

// SSR handler
const serverBundle = require('./server/index.js');
const handler = serverBundle.default || serverBundle;

if (typeof handler === 'function') {
  app.use('/', (req, res, next) => handler(req, res, next));
}

const server = app.listen(PORT, () => {
  console.log('[pareto] Production server running at http://localhost:' + PORT);
});

// Graceful shutdown
function shutdown(signal) {
  console.log('[pareto] ' + signal + ' received, shutting down gracefully...');
  server.close(() => {
    console.log('[pareto] Server closed.');
    process.exit(0);
  });
  // Force exit after 10s if connections aren't drained
  setTimeout(() => {
    console.error('[pareto] Forced shutdown after timeout.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
`
  fs.writeFileSync(path.resolve(outDir, 'index.js'), serverScript)
}
