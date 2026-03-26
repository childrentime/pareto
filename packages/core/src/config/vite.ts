import path from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'
import type { InlineConfig, Plugin } from 'vite'
import type { ParetoConfig } from '../types'

/**
 * Create Vite config for the client bundle.
 * Handles React, CSS/Tailwind, code splitting, and manifest generation.
 */
export function createClientConfig(options: {
  root: string
  outDir: string
  entry: string
  config: Required<ParetoConfig>
  isDev?: boolean
  plugins?: Plugin[]
}): InlineConfig {
  const { root, outDir, entry, config, isDev = false, plugins = [] } = options

  const baseConfig: InlineConfig = {
    root,
    mode: isDev ? 'development' : 'production',
    envPrefix: 'PARETO_',
    plugins: [
      createRequire(import.meta.url ?? __filename)('@vitejs/plugin-react').default(),
      ...plugins,
    ],
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
      'process.env.NODE_ENV': JSON.stringify(isDev ? 'development' : 'production'),
    },
  }

  return config.configureVite(baseConfig, { isServer: false })
}

/**
 * Create Vite config for the SSR server bundle.
 */
export function createServerConfig(options: {
  root: string
  outDir: string
  entry: string
  config: Required<ParetoConfig>
  plugins?: Plugin[]
}): InlineConfig {
  const { root, outDir, entry, config, plugins = [] } = options

  const baseConfig: InlineConfig = {
    root,
    mode: 'production',
    plugins: [
      createRequire(import.meta.url ?? __filename)('@vitejs/plugin-react').default(),
      ...plugins,
    ],
    build: {
      outDir,
      emptyOutDir: true,
      ssr: entry,
      sourcemap: true,
      rollupOptions: {
        output: {
          format: 'cjs',
          entryFileNames: 'index.js',
        },
      },
    },
    ssr: {
      // Externalize node_modules, bundle @paretojs/* and relative imports
      noExternal: [/^@paretojs\//],
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
    },
  }

  return config.configureVite(baseConfig, { isServer: true })
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
  return {
    '@paretojs/core/store': path.resolve(srcDir, 'store', 'index.ts'),
    '@paretojs/core/client': path.resolve(srcDir, 'client.ts'),
    '@paretojs/core/node': path.resolve(srcDir, 'node.ts'),
    '@paretojs/core': path.resolve(srcDir, 'index.ts'),
  }
}
