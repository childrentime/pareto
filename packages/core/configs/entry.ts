import fs from 'fs-extra'
import path from 'path'
import {
  CLIENT_ENTRY_PATH,
  CLIENT_WRAPPER,
  ENTRY,
  SERVER_ENTRY_PATH,
} from '../constant'
import { transformSepOfPath } from '../utils/util'
import pageConfig from './page.config'

const cwd = process.cwd()
const PAGE_DIR = path.resolve(cwd, pageConfig.pageDir ?? 'pages')

const pageEntries: Record<string, string> = fs.readdirSync(PAGE_DIR).reduce(
  (entry, filename) => {
    const pageEntry = path.resolve(PAGE_DIR, filename, 'index.tsx')
    entry[filename] = pageEntry
    return entry
  },
  {} as Record<string, string>,
)

const getServerEntry = () => {
  const getPagesStr = () => {
    const importStr =
      Object.entries(pageEntries).reduce((result, [pageName, modulePath]) => {
        return result + `import ${pageName} from '${modulePath}';\n`
      }, '') + '\n'

    const pageNames = Object.keys(pageEntries)
    const exportStr = `const pages = { ${pageNames.join(', ')} };\n\n`

    return { importStr, exportStr }
  }

  const getRuntimeStr = () => {
    const assetsStr = `const assets = __non_webpack_require__('../client/webpack-assets.json');\n\n`
    return {
      importStr: `import { setRuntimeConfig } from "@paretojs/core/node";\n\n`,
      runStr: assetsStr + 'setRuntimeConfig({ pages, assets });\n',
    }
  }

  const pageStr = getPagesStr()
  const runtimeStr = getRuntimeStr()

  const entryStr =
    pageStr.importStr +
    runtimeStr.importStr +
    pageStr.exportStr +
    runtimeStr.runStr

  fs.mkdirSync(ENTRY, { recursive: true })

  fs.writeFileSync(SERVER_ENTRY_PATH, transformSepOfPath(entryStr))

  return SERVER_ENTRY_PATH
}

const getClientEntries = () => {
  fs.ensureDirSync(ENTRY)
  fs.ensureDirSync(CLIENT_ENTRY_PATH)

  return Object.entries(pageEntries).reduce(
    (clientEntries, [pageName, modulePath]) => {
      const ext = modulePath.slice(
        modulePath.lastIndexOf('.'),
        modulePath.length,
      )
      const pageEntry = path.resolve(CLIENT_ENTRY_PATH, pageName + ext)
      const entryStr =
        `import page from '${modulePath}';\nimport { startApp } from '${CLIENT_WRAPPER}';\n` +
        `startApp(page)`

      fs.writeFileSync(pageEntry, transformSepOfPath(entryStr))
      clientEntries[pageName] = [
        path.resolve(CLIENT_ENTRY_PATH, `${pageName}${ext}`),
      ]

      return clientEntries
    },
    {} as Record<string, string[]>,
  )
}

export { getClientEntries, getServerEntry, pageEntries }
