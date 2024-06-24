import { rspack } from '@rspack/core'
import ReactRefreshPlugin from '@rspack/plugin-react-refresh'
import clearModule from 'clear-module'
import express from 'express'
import path from 'path'
import webpackDevMiddleware from 'webpack-dev-middleware'
import webpackHotMiddleware from 'webpack-hot-middleware'
import { pageEntries } from '../../configs/entry'
import { clientConfig } from '../../configs/rspack.client.config'
import { serverConfig } from '../../configs/rspack.server.config'
import { APP_PATH, CLIENT_OUTPUT_PATH } from '../../constant'
import { createDemandEntryMiddleware } from './lazy-compiler'

const port = process.env.PORT ?? 4000
const cwd = process.cwd()

const hotMiddlewareScript = `${require.resolve(
  'webpack-hot-middleware/client',
)}?path=/__webpack_hmr&timeout=20000&reload=true&noInfo=true`

const dev = () => {
  const server = express()

  process.on('uncaughtException', e => {
    console.error('uncaughtException', e)
  })
  process.on('unhandledRejection', e => {
    console.info('unhandledRejection:', e)
  })

  clientConfig.plugins?.push(new rspack.HotModuleReplacementPlugin())
  Object.keys(clientConfig.entry ?? {}).forEach(function (name) {
    // @ts-ignore
    clientConfig.entry[name].unshift(hotMiddlewareScript)
  })
  clientConfig.plugins?.push(new ReactRefreshPlugin())

  const clientCompiler = rspack(clientConfig)

  const serverWatcher = rspack(serverConfig).watch(
    { aggregateTimeout: 300 },
    (errors, stats) => {
      if (errors) {
        console.log(errors)
        throw errors
      } else {
        console.log(stats?.toString())
      }
    },
  )

  // @ts-ignore
  const devMiddleware = webpackDevMiddleware(clientCompiler, {
    publicPath: '/',
    writeToDisk(filePath) {
      return /\webpack-assets.json?$/.test(filePath)
    },
    stats: {
      all: false,
      env: true,
      errors: true,
      errorDetails: true,
      timings: true,
    },
  })

  // @ts-ignore
  const hotMiddleware = webpackHotMiddleware(clientCompiler, {
    log: message => {
      console.log('HMR LOGGER: ', message)
    },
    heartbeat: 2000,
  })

  server.use('/', express.static(CLIENT_OUTPUT_PATH))
  server.use('/', express.static(path.join(cwd, './public')))

  server.use(devMiddleware)
  server.use(hotMiddleware)
  server.use(
    createDemandEntryMiddleware({
      pageEntries,
      clientWatcher: clientCompiler.watching!,
      serverWatcher,
    }),
  )
  server.use('/', (req, res, next) => {
    clearModule(APP_PATH)
    const app = require(APP_PATH).app
    app.handle(req, res, next)
  })

  server.listen(port, () => {
    console.log(`server is listening on port: http://localhost:${port}`)
  })
}

export { dev }
