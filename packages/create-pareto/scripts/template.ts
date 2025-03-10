#!/usr/bin/env node
import { execSync } from 'child_process'
import fs from 'fs'
import { load } from 'js-yaml'
import path from 'path'
import { fileURLToPath } from 'url'

// Get current file directory
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

// First, run the rsync command
console.log('Running rsync to copy examples to templates...')
execSync(
  'rsync -av --progress ../../examples/ templates --exclude node_modules --exclude .pareto',
  { stdio: 'inherit' },
)

// Read catalog configuration from pnpm-workspace.yaml
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
      console.warn(
        'Warning: catalog configuration not found in pnpm-workspace.yaml',
      )
      return {}
    }

    console.log(
      'Read the following catalog configuration from pnpm-workspace.yaml:',
    )
    console.log(workspaceYaml.catalog)

    return workspaceYaml.catalog || {}
  } catch (error) {
    console.error('Error reading catalog configuration:', error)
    return {}
  }
}

// Read version information from all workspace packages
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

    // Read package.json from all subdirectories in the packages directory
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
            console.warn(
              `  - Error processing ${packageJsonPath}:`,
              err.message,
            )
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

// Process package.json files
function processPackageJson(
  filePath: string,
  catalogVersions: CatalogConfig,
  packageVersions: CatalogConfig,
): void {
  console.log(`Processing ${filePath}...`)

  try {
    // Read the file
    const packageJson = JSON.parse(
      fs.readFileSync(filePath, 'utf8'),
    ) as PackageJson
    let modified = false

    // Process dependencies
    ;['dependencies', 'devDependencies', 'peerDependencies'].forEach(
      depType => {
        const deps = packageJson[depType as keyof PackageJson] as
          | Record<string, string>
          | undefined

        if (deps) {
          Object.keys(deps).forEach(dep => {
            const version = deps[dep]

            // Replace catalog: dependencies
            if (version === 'catalog:') {
              // Check if defined in catalog
              if (catalogVersions[dep]) {
                deps[dep] = catalogVersions[dep]
                console.log(
                  `  - Replaced ${dep}: ${version} with ${catalogVersions[dep]} (from catalog)`,
                )
                modified = true
              } else {
                // If not defined in catalog, try to get latest version from npm
                try {
                  const latestVersion = execSync(`npm view ${dep} version`, {
                    encoding: 'utf8',
                  }).trim()
                  deps[dep] = `^${latestVersion}`
                  console.log(
                    `  - Replaced ${dep}: ${version} with ^${latestVersion} (from npm, not defined in catalog)`,
                  )
                } catch (error) {
                  // If npm view fails, use 'latest'
                  deps[dep] = 'latest'
                  console.log(
                    `  - Replaced ${dep}: ${version} with latest (fallback, not defined in catalog)`,
                  )
                }
                modified = true
              }
            }

            // Replace workspace:* dependencies
            else if (version === 'workspace:*') {
              // Check if defined in workspace packages
              if (packageVersions[dep]) {
                deps[dep] = `^${packageVersions[dep]}`
                console.log(
                  `  - Replaced ${dep}: ${version} with ^${packageVersions[dep]} (from workspace package)`,
                )
                modified = true
              } else {
                // If not defined in workspace packages, try to get latest version from npm
                try {
                  const latestVersion = execSync(`npm view ${dep} version`, {
                    encoding: 'utf8',
                  }).trim()
                  deps[dep] = `^${latestVersion}`
                  console.log(
                    `  - Replaced ${dep}: ${version} with ^${latestVersion} (from npm, not found in workspace)`,
                  )
                } catch (error) {
                  // If npm view fails, use 'latest'
                  deps[dep] = 'latest'
                  console.log(
                    `  - Replaced ${dep}: ${version} with latest (fallback, not found in workspace)`,
                  )
                }
                modified = true
              }
            }

            // Replace other workspace: prefixed dependencies
            else if (version.startsWith('workspace:')) {
              const actualVersion = version.replace('workspace:', '')
              deps[dep] = actualVersion
              console.log(
                `  - Replaced ${dep}: ${version} with ${actualVersion}`,
              )
              modified = true
            }
          })
        }
      },
    )

    // Write the file back if modified
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

// Find all package.json files in the templates directory
function findPackageJsonFiles(dir: string): string[] {
  const results: string[] = []
  const list = fs.readdirSync(dir)

  list.forEach(file => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)

    if (stat.isDirectory()) {
      // Recursively search directories
      results.push(...findPackageJsonFiles(filePath))
    } else if (file === 'package.json') {
      results.push(filePath)
    }
  })

  return results
}

// Main execution flow
;(async function main() {
  console.log('Reading catalog version configuration...')
  const catalogVersions = readCatalogVersions()

  console.log('Reading workspace package versions...')
  const packageVersions = readWorkspacePackageVersions()

  console.log('Finding and processing package.json files...')
  const templateDir = path.join(process.cwd(), 'templates')
  const packageJsonFiles = findPackageJsonFiles(templateDir)

  console.log(`Found ${packageJsonFiles.length} package.json files to process`)
  packageJsonFiles.forEach(file =>
    processPackageJson(file, catalogVersions, packageVersions),
  )

  console.log('Template processing complete!')
})()
