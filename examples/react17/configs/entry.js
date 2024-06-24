const fs = require('fs-extra')
const path = require('path')
const pageConfig = require('./page.config')

const cwd = process.cwd()
const PAGE_DIR = path.resolve(cwd, pageConfig.pageDir)

const {
  ENTRY,
  SERVER_ENTRY_PATH,
  CLIENT_ENTRY_PATH,
  CLIENT_WRAPPER,
} = require('../constant')

/**
 * @type {record<string,string>}
 */
const pageEntries = fs.readdirSync(PAGE_DIR).reduce((entry, filename) => {
  const pageEntry = path.resolve(PAGE_DIR, filename, 'index.tsx')
  entry[filename] = pageEntry
  return entry
}, {})

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
    const configPath = path.resolve(cwd, 'configs', 'runtime.config.js')
    return {
      importStr: `import { setRuntimeConfig } from "${configPath}";\n\n`,
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
  fs.writeFileSync(SERVER_ENTRY_PATH, entryStr)

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

      fs.writeFileSync(pageEntry, entryStr)
      clientEntries[pageName] = [
        path.resolve(CLIENT_ENTRY_PATH, `${pageName}${ext}`),
      ]

      return clientEntries
    },
    {},
  )
}

module.exports = {
  getServerEntry,
  getClientEntries,
  pageEntries,
}
