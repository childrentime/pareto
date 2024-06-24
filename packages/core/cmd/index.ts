import cac from 'cac'
import fs from 'fs-extra'
import { DIST_PATH } from '../constant'
import { version } from '../package.json'

const cli = cac('pareto').version(version).help()

cli.command('dev', 'start dev server').action(async () => {
  if (fs.existsSync(DIST_PATH)) {
    fs.removeSync(DIST_PATH)
  }
  fs.ensureDirSync(DIST_PATH)
  const { dev } = await import('./dev')
  dev()
})

cli.command('build', 'build dev server').action(async () => {
  if (fs.existsSync(DIST_PATH)) {
    fs.removeSync(DIST_PATH)
  }
  fs.ensureDirSync(DIST_PATH)
  const { build } = await import('./build')
  build()
})

cli.parse()
