const runner = process.env.runner || "webpack";
const useWebpack = runner === 'webpack';

const { EntryOptionPlugin } = useWebpack ? require('webpack') : require("@rspack/core");
const { clearEntryContent } = require("./replace");

module.exports = class WebpackDemandEntryPlugin {
  constructor(options) {
    this.options = {
      pageEntries: {},
      ...options,
    };
  }

  apply(compiler) {
    compiler.compiledEntries = {};

    Object.entries(this.options.pageEntries).forEach(([, path]) => {
      clearEntryContent(path);
    });

    compiler.hooks.entryOption.tap("EntryOptions", (context, entry) => {
      const newEntry = () => {
        if (!compiler.allEntries) {
          compiler.allEntries = entry
        }
        // 基础路由，首次一定要编译的entry
        // 客户端为空 服务端需要编译 server.ts和app.ts
        const baseEntry = Object.entries(entry).reduce(
          (all, [key]) => {
            if (!this.options.pageEntries[key]) {
              // @ts-expect-error
              all[key] = entry[key];
            }
            return all;
          },
          {}
        );

        return {
          ...baseEntry,
          ...Object.keys(compiler.compiledEntries).reduce((all, key) => {
            const config = compiler.compiledEntries[key];
            if (config) {
              all[key] = config;
            }
            return all;
          }, {}),
        };
      };

      // TODO: rspack不支持 dynamic entry
      EntryOptionPlugin.applyEntryOption(compiler, context, newEntry);
      // EntryOptionPlugin.applyEntryOption(compiler, context, entry);
      return true;
    });
  }
}
