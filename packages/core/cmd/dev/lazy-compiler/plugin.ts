import type { Compiler, EntryStaticNormalized } from '@rspack/core'
import { EntryOptionPlugin } from '@rspack/core'
import { clearEntryContent } from './replace'

export type EntryCompiler = Compiler & {
  compiledEntries: EntryStaticNormalized
  allEntries: EntryStaticNormalized
}

interface Options {
  pageEntries?: Record<string, string>
}

export default class WebpackDemandEntryPlugin {
  public options: Options

  constructor(options: Options) {
    this.options = {
      pageEntries: {} as Record<string, string>,
      ...options,
    }
  }

  apply(compiler: EntryCompiler) {
    compiler.compiledEntries = {}

    Object.entries(this.options.pageEntries ?? {}).forEach(([, path]) => {
      clearEntryContent(path)
    })

    compiler.hooks.entryOption.tap('EntryOptions', (context, entry) => {
      // eslint-disable-next-line @typescript-eslint/require-await
      const newEntry = async (): Promise<EntryStaticNormalized> => {
        if (!compiler.allEntries) {
          compiler.allEntries = entry as EntryStaticNormalized
        }

        const baseEntry = Object.entries(entry).reduce((all, [key]) => {
          if (!this.options.pageEntries?.[key]) {
            all[key] = (entry as EntryStaticNormalized)[key]
          }
          return all
        }, {} as EntryStaticNormalized)

        return {
          ...baseEntry,
          ...Object.keys(compiler.compiledEntries).reduce(
            (all, key) => {
              const config = compiler.compiledEntries[key]
              if (config) {
                all[key] = config
              }
              return all
            },
            {} as Record<string, any>,
          ),
        }
      }

      EntryOptionPlugin.applyEntryOption(compiler, context, newEntry)
      return true
    })
  }
}
