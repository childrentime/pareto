import fs from 'fs-extra'
import { SERVER_ENTRY_PATH } from '../../../constant'

const escape = (path: string) =>
  path.replace(/\\/g, '\\\\').replace(/\//g, '\\/').replace(/\./g, '\\.')

// import change to  const
const clearEntryContent = (filePath: string) => {
  const entryContent = fs.readFileSync(SERVER_ENTRY_PATH).toString()
  const reg = new RegExp(
    "(?:^|\n)(import\\s+(\\w+)\\s+from\\s+'" + escape(filePath) + "';)",
    'g',
  )
  fs.writeFileSync(
    SERVER_ENTRY_PATH,
    entryContent.replace(reg, (all, main, name) => {
      return `\n// ${main}\nconst ${name} = {};`
    }),
  )
}

// import recoverEntryContent from  const
const recoverEntryContent = (filePath: string) => {
  const entryContent = fs.readFileSync(SERVER_ENTRY_PATH).toString()
  const reg = new RegExp(
    "\\/\\/\\s+import\\s+(\\w+)\\s+from\\s+'" + escape(filePath) + "';",
  )
  let moduleName
  const newContent = entryContent
    .replace(reg, (all, name) => {
      moduleName = name
      return all.replace(/^\/\/\s+/, '')
    })
    .replace(new RegExp(`const ${moduleName} = \\{\\};`, 'g'), '')
  fs.writeFileSync(SERVER_ENTRY_PATH, newContent)
}

export { clearEntryContent, recoverEntryContent }
