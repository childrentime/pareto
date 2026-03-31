import type { ParetoConfig } from '../types'

export const defaultConfig: Required<ParetoConfig> = {
  appDir: 'app',
  outDir: '.pareto',
  configureVite: config => config,
  wkWebViewFlushHint: false,
}
