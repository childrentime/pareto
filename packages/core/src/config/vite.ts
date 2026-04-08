import fs from 'fs'
import { createRequire } from 'module'
import path from 'path'
import { fileURLToPath } from 'url'
import type { InlineConfig, Plugin } from 'vite'

/**
 * Load @vitejs/plugin-react via createRequire (works in both CJS and ESM contexts).
 */
export function loadReactPlugin(): Plugin {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  return createRequire(import.meta.url ?? __filename)(
    '@vitejs/plugin-react',
  ).default() as Plugin
}

/**
 * Create Vite config for the client bundle.
 * Handles React, CSS/Tailwind, code splitting, and manifest generation.
 */
export function createClientConfig(options: {
  root: string
  outDir: string
  entry: string
  isDev?: boolean
  plugins?: Plugin[]
}): InlineConfig {
  const { root, outDir, entry, isDev = false, plugins = [] } = options

  const baseConfig: InlineConfig = {
    root,
    mode: isDev ? 'development' : 'production',
    envPrefix: 'PARETO_',
    plugins: [loadReactPlugin(), ...plugins],
    build: {
      outDir,
      emptyOutDir: true,
      manifest: true,
      sourcemap: isDev ? 'inline' : true,
      rollupOptions: {
        input: entry,
        output: {
          entryFileNames: 'assets/js/[name].[hash].js',
          chunkFileNames: 'assets/js/[name].[hash].js',
          assetFileNames: 'assets/[ext]/[name].[hash].[ext]',
        },
      },
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(
        isDev ? 'development' : 'production',
      ),
    },
  }

  return baseConfig
}

/**
 * Create Vite config for the SSR server bundle.
 */
export function createServerConfig(options: {
  root: string
  outDir: string
  entry: string
  plugins?: Plugin[]
}): InlineConfig {
  const { root, outDir, entry, plugins = [] } = options

  const baseConfig: InlineConfig = {
    root,
    mode: 'production',
    plugins: [loadReactPlugin(), ...plugins],
    build: {
      outDir,
      emptyOutDir: true,
      ssr: true,
      sourcemap: true,
      rollupOptions: {
        input: entry,
        output: {
          format: 'cjs',
          entryFileNames: 'index.js',
        },
      },
    },
    ssr: {
      noExternal: [/^@paretojs\//],
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
    },
  }

  return baseConfig
}

/**
 * Resolve @paretojs/core source aliases for dev mode.
 * In dev, Vite resolves from source TS files directly.
 */
export function getCoreSourceAliases(): Record<string, string> {
  let srcDir: string
  try {
    const _require = createRequire(import.meta.url ?? __filename)
    const pkgPath = _require.resolve('@paretojs/core/package.json')
    srcDir = path.join(path.dirname(pkgPath), 'src')
  } catch {
    // Fallback: resolve relative to this file
    const thisDir = path.dirname(fileURLToPath(import.meta.url))
    srcDir = path.resolve(thisDir, '..')
  }

  // Only alias to source files when src/ exists (monorepo dev).
  // When installed from npm, src/ is not published — let Vite
  // resolve via the package.json exports field instead.
  if (!fs.existsSync(srcDir)) {
    return {}
  }

  return {
    '@paretojs/core/store': path.resolve(srcDir, 'store', 'index.ts'),
    '@paretojs/core/client': path.resolve(srcDir, 'client.ts'),
    '@paretojs/core/node': path.resolve(srcDir, 'node.ts'),
    '@paretojs/core': path.resolve(srcDir, 'index.ts'),
  }
}
