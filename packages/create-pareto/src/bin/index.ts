import fse from 'fs-extra';
import path from 'node:path';
import prompts from 'prompts';
import * as process from 'node:process';
import fsPromises from 'node:fs/promises';
import { red, green, bold } from 'kolorist';
import { existsSync, readdirSync } from 'node:fs';

// check if the package name is valid
// unValid package name: MyProject | @my-scope/ | -my-project
function isValidPackageName(projectName: string): boolean {
  return /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(
    projectName
  );
}

function toValidPackageName(projectName: string) {
  return projectName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/^[._]/, '')
    .replace(/[^a-z0-9-~]+/g, '-');
}

function canSafelyOverwrite(dir: string): boolean {
  const directoryExists = existsSync(dir);

  if (!directoryExists) {
    return true;
  }

  // the file exists, but is it empty?
  // when it's empty, we can safely overwrite it.
  return readdirSync(dir).length === 0;
}

async function main() {
  let targetDir = '';
  const defaultProjectName = 'pareto-project';

  // from ./dist
  const templateRoot = path.join(__dirname, '../templates');
  const CHOICES = readdirSync(templateRoot);

  let result: {
    packageName: string
    shouldOverwrite: string
    chooseProject: string
  };

  try {
    result = (await prompts(
      [
        {
          name: 'projectName',
          type: 'text',
          message: 'What is your project named?',
          initial: defaultProjectName,
          onState: (state) => (targetDir = String(state.value).trim() || defaultProjectName)
        },
        {
          name: 'shouldOverwrite',
          type: () => (canSafelyOverwrite(targetDir) ? null : 'confirm'),
          message: `Folder exists. Remove existing files and continue?`
        },
        {
          name: 'overwriteChecker',
          type: (values) => {
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
          validate: (dir: string) => isValidPackageName(dir) || 'Invalid package.json name'
        },
        {
          name: 'chooseProject',
          type: 'select',
          message: 'Choose a project template',
          choices: [
            {title: 'base-template', value: CHOICES.find(c => c.includes('base'))},
            {title: 'mobx-template', value: CHOICES.find(c => c.includes('mobx'))},
            {title: 'spa-template', value: CHOICES.find(c => c.includes('spa'))},
            {title: 'tailwindcss-template', value: CHOICES.find(c => c.includes('tailwind'))},
            {title: 'zustand-template', value: CHOICES.find(c => c.includes('zustand'))},
            {title: 'monitor-template', value: CHOICES.find(c => c.includes('monitor'))},
          ]
        }
      ],
      {
        onCancel: () => {
          throw new Error(red('✖') + ' Operation cancelled');
        }
      }
    ));

  } catch (e) {
    if (e instanceof Error) {
      console.log(e.message);
    }
    process.exit(1);
  }

  const { packageName, shouldOverwrite, chooseProject } = result;

  const root = path.resolve(targetDir);

  // shouldOverwrite === undefined means folder doesn't exist.
  // shouldOverwrite === true means folder exists, and it can be safely overwritten.
  if (shouldOverwrite) {
    await fse.emptyDir(root);
  } else if (!existsSync(root)) {
    // if the folder doesn't exist, create it
    await fsPromises.mkdir(root, { recursive: true });
  }

  const pkg = {
    name: packageName ?? toValidPackageName(targetDir),
    version: '0.0.1',
  };

  console.log('Setting up project ...');

  // -----------------------------------------------------------------------------------
  const templateDir = path.join(templateRoot, chooseProject);
  const packageJsonPath = path.join(root, 'package.json');
  const templatePackageJsonPath = path.join(templateDir, 'package.json');

  const newPackageJson = JSON.parse(
    await fsPromises.readFile(templatePackageJsonPath, 'utf-8')
  );

  await fse.copy(templateDir, root);

  await fsPromises.writeFile(
    packageJsonPath,
    JSON.stringify(
      {
        ...newPackageJson,
        ...pkg
      },
      null,
      2
    )
  );

  // -----------------------------------------------------------------------------------
  const manager = process.env.npm_config_user_agent ?? '';
  const packageManager = /pnpm/.test(manager)
    ? 'pnpm'
    : /yarn/.test(manager)
      ? 'yarn'
      : 'npm';

  const commandsMap = {
    install: {
      pnpm: 'pnpm install',
      yarn: 'yarn',
      npm: 'npm install'
    },
    dev: {
      pnpm: 'pnpm dev',
      yarn: 'yarn dev',
      npm: 'npm run dev'
    }
  };

  console.log(`\nDone. Now run:\n`);
  console.log(`${bold(green(`cd ${targetDir}`))}`);
  console.log(`${bold(green(commandsMap.install[packageManager]))}`);
  console.log(`${bold(green(commandsMap.dev[packageManager]))}`);
  console.log();
}

main().then().catch(e => console.log(e));
