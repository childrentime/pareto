import fse from 'fs-extra'
import { bold, green, red } from 'kolorist'
import { existsSync, readdirSync } from 'node:fs'
import fsPromises from 'node:fs/promises'
import path from 'node:path'
import * as process from 'node:process'
import prompts from 'prompts'

function generateAgentsMd(): string {
  return `<!-- BEGIN:pareto-agent-rules -->
# Pareto: ALWAYS read docs before coding

Before writing any Pareto code, find and read the relevant doc in
\`node_modules/@paretojs/core/docs/\`. Your training data may be outdated —
the bundled docs are the source of truth for the installed version.

## Docs index

### Guides
- Introduction: \`docs/guides/introduction.md\`
- Quick Start: \`docs/guides/quick-start.md\`

### Concepts
- File-Based Routing: \`docs/concepts/routing.md\`
- Streaming SSR: \`docs/concepts/streaming.md\`
- State Management: \`docs/concepts/state-management.md\`
- Error Handling: \`docs/concepts/error-handling.md\`
- Head Management: \`docs/concepts/head-management.md\`
- Redirects & 404: \`docs/concepts/redirects.md\`
- Resource Routes: \`docs/concepts/resource-routes.md\`
- Document Customization: \`docs/concepts/document-customization.md\`

### API Reference
- Core API: \`docs/api/core.md\`
- Store API: \`docs/api/store.md\`
- Node API: \`docs/api/node.md\`
- Configuration: \`docs/api/config.md\`

All paths relative to \`node_modules/@paretojs/core/\`.
<!-- END:pareto-agent-rules -->
`
}

function isValidPackageName(projectName: string): boolean {
  return /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(
    projectName,
  )
}

function toValidPackageName(projectName: string) {
  return projectName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/^[._]/, '')
    .replace(/[^a-z0-9-~]+/g, '-')
}

function canSafelyOverwrite(dir: string): boolean {
  const directoryExists = existsSync(dir)
  if (!directoryExists) return true
  return readdirSync(dir).length === 0
}

async function main() {
  const argProjectName = process.argv[2]
  let targetDir = argProjectName ?? ''
  const defaultProjectName = 'pareto-project'

  const templateRoot = path.join(__dirname, '../templates')

  let result: {
    packageName: string
    shouldOverwrite: string
  }

  try {
    result = await prompts(
      [
        {
          name: 'projectName',
          type: argProjectName ? null : 'text',
          message: 'What is your project named?',
          initial: defaultProjectName,
          onState: state =>
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            (targetDir = String(state.value).trim() || defaultProjectName),
        },
        {
          name: 'shouldOverwrite',
          type: () => (canSafelyOverwrite(targetDir) ? null : 'confirm'),
          message: `Folder exists. Remove existing files and continue?`,
        },
        {
          name: 'overwriteChecker',
          type: values => {
            if (values === false) {
              throw new Error(red('✖') + ' Operation cancelled')
            }
            return null
          },
        },
        {
          name: 'packageName',
          type: () => (isValidPackageName(targetDir) ? null : 'text'),
          message: 'Package name',
          initial: () => toValidPackageName(targetDir),
          validate: (dir: string) =>
            isValidPackageName(dir) || 'Invalid package.json name',
        },
      ],
      {
        onCancel: () => {
          throw new Error(red('✖') + ' Operation cancelled')
        },
      },
    )
  } catch (e) {
    if (e instanceof Error) {
      console.log(e.message)
    }
    process.exit(1)
  }

  const { packageName, shouldOverwrite } = result
  const root = path.resolve(targetDir)

  if (shouldOverwrite) {
    await fse.emptyDir(root)
  } else if (!existsSync(root)) {
    await fsPromises.mkdir(root, { recursive: true })
  }

  const pkg = {
    name: packageName ?? toValidPackageName(targetDir),
    version: '0.0.1',
  }

  console.log('Setting up project ...')

  const templateDir = path.join(templateRoot, 'app')
  const packageJsonPath = path.join(root, 'package.json')
  const templatePackageJsonPath = path.join(templateDir, 'package.json')

  const newPackageJson = JSON.parse(
    await fsPromises.readFile(templatePackageJsonPath, 'utf-8'),
  )

  await fse.copy(templateDir, root)

  await fsPromises.writeFile(
    packageJsonPath,
    JSON.stringify(
      {
        ...newPackageJson,
        ...pkg,
      },
      null,
      2,
    ),
  )

  // Generate AGENTS.md with framework docs pointer
  await fsPromises.writeFile(path.join(root, 'AGENTS.md'), generateAgentsMd())

  const manager = process.env.npm_config_user_agent ?? ''
  const packageManager = manager.includes('pnpm')
    ? 'pnpm'
    : manager.includes('yarn')
      ? 'yarn'
      : 'npm'

  const commandsMap = {
    install: {
      pnpm: 'pnpm install',
      yarn: 'yarn',
      npm: 'npm install',
    },
    dev: {
      pnpm: 'pnpm dev',
      yarn: 'yarn dev',
      npm: 'npm run dev',
    },
  }

  console.log(`\nDone. Now run:\n`)
  console.log(`${bold(green(`cd ${targetDir}`))}`)
  console.log(`${bold(green(commandsMap.install[packageManager]))}`)
  console.log(`${bold(green(commandsMap.dev[packageManager]))}`)
  console.log()
}

main()
  .then()
  .catch(e => console.log(e))
