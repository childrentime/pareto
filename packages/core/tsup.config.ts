import { defineConfig } from 'tsup'

export default defineConfig([
  // Runtime library — CJS + ESM + type declarations
  {
    entry: {
      index: 'src/index.ts',
      node: 'src/node.ts',
      client: 'src/client.ts',
      'store/index': 'src/store/index.ts',
    },
    format: ['cjs', 'esm'],
    dts: true,
    splitting: true,
    sourcemap: true,
    clean: true,
    outDir: 'dist',
    external: [
      'react',
      'react-dom',
      'express',
      'vite',
      '@vitejs/plugin-react',
      'serialize-javascript',
    ],
  },
  // CLI — ESM with shebang
  {
    entry: { cli: 'src/cli/index.ts' },
    format: ['esm'],
    dts: false,
    splitting: false,
    sourcemap: true,
    clean: false,
    outDir: 'dist',
    banner: {
      js: '#!/usr/bin/env node',
    },
    external: [
      'vite',
      '@vitejs/plugin-react',
      '@paretojs/core',
      'express',
      'react',
      'react-dom',
      'serialize-javascript',
    ],
  },
])
