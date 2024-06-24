import consola from 'consola'
import { execSync } from 'node:child_process'
import path, { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { version } from '../package.json'

execSync('npm run build', { stdio: 'inherit' })

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

let command = 'npm publish --access public'

if (version.includes('beta')) {
  command += ' --tag beta'
}

execSync(command, {
  stdio: 'inherit',
  cwd: path.resolve(__dirname, '../'),
})

consola.success('Published @paretojs/monitor package.')
