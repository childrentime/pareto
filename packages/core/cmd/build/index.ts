import { rspack } from '@rspack/core'
import fs from 'fs-extra'
import path from 'path'
import { clientConfig } from '../../configs/rspack.client.config'
import { serverConfig } from '../../configs/rspack.server.config'
import { DIST_PATH } from '../../constant'

const cwd = process.cwd()

const build = () => {
  const clientCompiler = rspack(clientConfig)
  const serverCompiler = rspack(serverConfig)
  clientCompiler.run((err, stats) => {
    if (err) {
      console.error('client webpack error', err)
      return
    }
    console.log(stats?.toString())

    serverCompiler.run((err, stats) => {
      if (err) {
        console.error('server webpack error', err)
        return
      }
      console.log(stats?.toString())
    })
  })
  fs.copy(path.resolve(cwd, 'public'), path.resolve(DIST_PATH, 'public')).catch(
    console.error,
  )
  fs.copyFileSync(
    path.resolve(__dirname, '../bin/start.js'),
    path.resolve(DIST_PATH, 'index.js'),
  )
}

export { build }
