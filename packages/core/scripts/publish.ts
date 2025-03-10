import consola from 'consola'
import { execSync } from 'node:child_process'
import path from 'node:path'
import { version } from '../package.json'

execSync('npm run build:bin', { stdio: 'inherit' })
execSync('npm run build', { stdio: 'inherit' })

let command = 'pnpm publish --access public --no-git-checks'

if (version.includes('beta')) {
  command += ' --tag beta'
}

execSync(command, {
  stdio: 'inherit',
  cwd: path.resolve(__dirname, '../'),
})
consola.success('Published @pareto/core package.')
