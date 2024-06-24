import type { ParetoConfig } from '@paretojs/core/config'
import { rspack } from '@rspack/core'

const config: ParetoConfig = {
  pageDir: 'pages',
  configureRspack(config, { isServer }) {
    if (isServer) {
      config.plugins!.push(
        new rspack.DefinePlugin({
          'process.env.password': JSON.stringify('password'),
        }),
      )
    }
    return config
  },
  distDir: 'dist',
}

export default config
