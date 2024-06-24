import type { Configuration } from '@rspack/core'

export interface ParetoConfig {
  pageDir?: string
  configureRspack?: (
    config: RspackConfiguration,
    options: {
      isServer: boolean
    },
  ) => RspackConfiguration
  enableSpa?: boolean
  enableMonitor?: boolean
  distDir?: string
}

export type RspackConfiguration = Configuration
