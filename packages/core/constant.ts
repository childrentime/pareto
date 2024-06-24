import path from 'path'
import pageConfig from './configs/page.config'

const cwd = process.cwd()
const { distDir = '.pareto' } = pageConfig

const DIST_PATH = path.resolve(cwd, distDir)
const APP_PATH = path.resolve(cwd, `${distDir}/server`)
const ENTRY = path.resolve(cwd, distDir, 'entry')
const SERVER_ENTRY_PATH = path.resolve(ENTRY, './server.ts')
const CLIENT_ENTRY_PATH = path.resolve(ENTRY, 'client')
const CLIENT_WRAPPER = path.resolve(cwd, './client-entry.tsx')
const CLIENT_OUTPUT_PATH = path.resolve(cwd, `${distDir}/client`)
const ASSETS_PATH = path.resolve(CLIENT_OUTPUT_PATH, 'webpack-assets.json')

export {
  APP_PATH,
  ASSETS_PATH,
  CLIENT_ENTRY_PATH,
  CLIENT_OUTPUT_PATH,
  CLIENT_WRAPPER,
  DIST_PATH,
  ENTRY,
  SERVER_ENTRY_PATH,
}
