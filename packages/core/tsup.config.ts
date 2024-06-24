import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['cmd/index.ts'],
  splitting: true,
  sourcemap: true,
  clean: true,
  dts: true,
  format: ['cjs'],
  outDir: 'dist-bin',
})
