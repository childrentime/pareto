#!/usr/bin/env node
import { execSync } from 'child_process'
import fs from 'fs'
import { load } from 'js-yaml'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface CatalogConfig {
  [key: string]: string
}

interface PackageJson {
  name?: string
  version?: string
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
  [key: string]: any
}

// Copy the v3 example app into templates/app
console.log('Copying example app to templates/app...')

const templatesDir = path.resolve(__dirname, '..', 'templates')
const appTemplateDir = path.join(templatesDir, 'app')

// Clean and recreate
if (fs.existsSync(templatesDir)) {
  fs.rmSync(templatesDir, { recursive: true })
}
fs.mkdirSync(appTemplateDir, { recursive: true })

// rsync the example app (excluding node_modules, .pareto, test-results, e2e)
execSync(
  'rsync -av --progress ../../examples/ templates/app ' +
    '--exclude node_modules --exclude .pareto --exclude test-results --exclude e2e ' +
    '--exclude playwright.config.ts --exclude "*.spec.ts" --exclude skills-lock.json --exclude public',
  { stdio: 'inherit', cwd: path.resolve(__dirname, '..') },
)

function readCatalogVersions(): CatalogConfig {
  try {
    const rootDir = path.resolve(__dirname, '../../..')
    const workspaceYamlPath = path.join(rootDir, 'pnpm-workspace.yaml')

    if (!fs.existsSync(workspaceYamlPath)) {
      console.warn('Warning: pnpm-workspace.yaml file not found')
      return {}
    }

    const workspaceYaml = load(fs.readFileSync(workspaceYamlPath, 'utf8')) as {
      catalog?: CatalogConfig
    }
    if (!workspaceYaml || !workspaceYaml.catalog) {
      console.warn('Warning: catalog configuration not found in pnpm-workspace.yaml')
      return {}
    }

    console.log('Read catalog configuration from pnpm-workspace.yaml:')
    console.log(workspaceYaml.catalog)
    return workspaceYaml.catalog || {}
  } catch (error) {
    console.error('Error reading catalog configuration:', error)
    return {}
  }
}

function readWorkspacePackageVersions(): CatalogConfig {
  try {
    const rootDir = path.resolve(__dirname, '../../..')
    const packagesDir = path.join(rootDir, 'packages')

    if (!fs.existsSync(packagesDir)) {
      console.warn('Warning: packages directory not found')
      return {}
    }

    console.log('Reading package versions from packages directory...')
    const packageVersions: CatalogConfig = {}

    const packages = fs.readdirSync(packagesDir)
    packages.forEach(pkg => {
      const packageJsonPath = path.join(packagesDir, pkg, 'package.json')
      if (fs.existsSync(packageJsonPath)) {
        try {
          const packageJson = JSON.parse(
            fs.readFileSync(packageJsonPath, 'utf8'),
          ) as PackageJson
          if (packageJson.name && packageJson.version) {
            packageVersions[packageJson.name] = packageJson.version
            console.log(`  - ${packageJson.name}@${packageJson.version}`)
          }
        } catch (err) {
          if (err instanceof Error) {
            console.warn(`  - Error processing ${packageJsonPath}:`, err.message)
          }
        }
      }
    })

    return packageVersions
  } catch (error) {
    console.error('Error reading workspace package versions:', error)
    return {}
  }
}

function processPackageJson(
  filePath: string,
  catalogVersions: CatalogConfig,
  packageVersions: CatalogConfig,
): void {
  console.log(`Processing ${filePath}...`)

  try {
    const packageJson = JSON.parse(
      fs.readFileSync(filePath, 'utf8'),
    ) as PackageJson
    let modified = false

    ;['dependencies', 'devDependencies', 'peerDependencies'].forEach(depType => {
      const deps = packageJson[depType as keyof PackageJson] as
        | Record<string, string>
        | undefined

      if (deps) {
        Object.keys(deps).forEach(dep => {
          const version = deps[dep]

          if (version === 'catalog:') {
            if (catalogVersions[dep]) {
              deps[dep] = catalogVersions[dep]
              console.log(`  - Replaced ${dep}: ${version} with ${catalogVersions[dep]} (from catalog)`)
            } else {
              try {
                const latestVersion = execSync(`npm view ${dep} version`, { encoding: 'utf8' }).trim()
                deps[dep] = `^${latestVersion}`
                console.log(`  - Replaced ${dep}: ${version} with ^${latestVersion} (from npm)`)
              } catch {
                deps[dep] = 'latest'
                console.log(`  - Replaced ${dep}: ${version} with latest (fallback)`)
              }
            }
            modified = true
          } else if (version === 'workspace:*') {
            if (packageVersions[dep]) {
              deps[dep] = `^${packageVersions[dep]}`
              console.log(`  - Replaced ${dep}: ${version} with ^${packageVersions[dep]} (from workspace)`)
            } else {
              try {
                const latestVersion = execSync(`npm view ${dep} version`, { encoding: 'utf8' }).trim()
                deps[dep] = `^${latestVersion}`
                console.log(`  - Replaced ${dep}: ${version} with ^${latestVersion} (from npm)`)
              } catch {
                deps[dep] = 'latest'
                console.log(`  - Replaced ${dep}: ${version} with latest (fallback)`)
              }
            }
            modified = true
          } else if (version.startsWith('workspace:')) {
            const actualVersion = version.replace('workspace:', '')
            deps[dep] = actualVersion
            console.log(`  - Replaced ${dep}: ${version} with ${actualVersion}`)
            modified = true
          }
        })
      }
    })

    // Remove e2e / playwright devDependencies and scripts from template
    if (packageJson.devDependencies) {
      delete packageJson.devDependencies['@playwright/test']
    }
    if (packageJson.scripts) {
      delete (packageJson.scripts as Record<string, string>)['test:e2e']
    }

    if (modified) {
      fs.writeFileSync(filePath, JSON.stringify(packageJson, null, 2) + '\n')
      console.log(`  - Updated ${filePath}`)
    } else {
      console.log(`  - No changes needed for ${filePath}`)
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error)
  }
}

function findPackageJsonFiles(dir: string): string[] {
  const results: string[] = []
  const list = fs.readdirSync(dir)

  list.forEach(file => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    if (stat.isDirectory()) {
      results.push(...findPackageJsonFiles(filePath))
    } else if (file === 'package.json') {
      results.push(filePath)
    }
  })

  return results
}

;(async function main() {
  console.log('Reading catalog version configuration...')
  const catalogVersions = readCatalogVersions()

  console.log('Reading workspace package versions...')
  const packageVersions = readWorkspacePackageVersions()

  console.log('Finding and processing package.json files...')
  const packageJsonFiles = findPackageJsonFiles(templatesDir)

  console.log(`Found ${packageJsonFiles.length} package.json files to process`)
  packageJsonFiles.forEach(file =>
    processPackageJson(file, catalogVersions, packageVersions),
  )

  console.log('Template processing complete!')
})()
