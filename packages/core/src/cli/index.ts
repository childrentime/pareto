process.env.BROWSERSLIST_IGNORE_OLD_DATA = '1'

import cac from 'cac'
import { loadEnv } from '../config/env'

const cli = cac('pareto').help()

cli.command('dev', 'Start development server with HMR').action(async () => {
  process.env.NODE_ENV = process.env.NODE_ENV ?? 'development'
  loadEnv()
  const { dev } = await import('./dev')
  await dev()
})

cli.command('build', 'Build for production').action(async () => {
  process.env.NODE_ENV = 'production'
  loadEnv()
  const { build } = await import('./build')
  await build()
})

cli.command('start', 'Start production server').action(async () => {
  process.env.NODE_ENV = 'production'
  loadEnv()
  const { start } = await import('./start')
  await start()
})

cli.parse()
