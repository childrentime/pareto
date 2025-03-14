import type { Watching } from '@rspack/core'
import type { NextFunction, Request, Response } from 'express'
import fs from 'fs-extra'
import { ASSETS_PATH } from '../../../constant'
import type { EntryCompiler } from './plugin'
import { recoverEntryContent } from './replace'

const createDemandEntryMiddleware = ({
  clientWatcher,
  pageEntries,
  serverWatcher,
}: {
  clientWatcher: Watching
  pageEntries: Record<string, string>
  serverWatcher: Watching
}) => {
  if (!fs.existsSync(ASSETS_PATH)) {
    fs.createFileSync(ASSETS_PATH)
    fs.writeFileSync(ASSETS_PATH, '{}') // 兜下底，访问了非html页面会报错
  }

  const clientCompiler = clientWatcher.compiler as EntryCompiler
  const serverComplier = serverWatcher.compiler as EntryCompiler
  const compiledPromise = {} as Record<string, Promise<unknown> | undefined>

  return async function (req: Request, res: Response, next: NextFunction) {
    try {
      const name = req.path.slice(1)
      const isPage = !!pageEntries[name]

      // 非入口页面
      if (!isPage) {
        return next()
      }

      if (!compiledPromise[name]) {
        console.log(`${name} is building ...`)
        recoverEntryContent(pageEntries[name])

        clientCompiler.compiledEntries[name] = clientCompiler.allEntries[name]

        const invalidateClientWatcherPromise = (() => {
          return new Promise<void>((resolve, reject) => {
            clientWatcher.invalidate(err => {
              if (err) {
                delete clientCompiler.compiledEntries[name]
                reject(err)
              } else {
                resolve()
              }
            })
          })
        })()

        const afterEmitClientPromise = (() => {
          return new Promise<void>(resolve => {
            clientCompiler.hooks.afterEmit.tap('emit complete', () => {
              resolve()
            })
          })
        })()

        const afterEmitServerPromise = (() => {
          return new Promise<void>(resolve => {
            serverComplier.hooks.afterEmit.tap('emit complete', () => {
              resolve()
            })
          })
        })()

        compiledPromise[name] = Promise.all([
          invalidateClientWatcherPromise,
          afterEmitClientPromise,
          afterEmitServerPromise,
        ])
      }

      await compiledPromise[name]

      next()
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      next()
    }
  }
}

export { createDemandEntryMiddleware }
