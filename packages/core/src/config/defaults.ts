import type { ParetoConfig } from '../types'

export const defaultConfig: Required<ParetoConfig> = {
  appDir: 'app',
  outDir: '.pareto',
  wkWebViewFlushHint: false,
}
