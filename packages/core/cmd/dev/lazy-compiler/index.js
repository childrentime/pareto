const { recoverEntryContent } = require("./replace");
const fs = require("fs-extra");
const { ASSETS_PATH } = require("../../../constant");

const createDemandEntryMiddleware = ({ clientWatcher, pageEntries, serverWatcher }) => {
  if (!fs.existsSync(ASSETS_PATH)) {
    fs.createFileSync(ASSETS_PATH);
    fs.writeFileSync(ASSETS_PATH, "{}"); // 兜下底，访问了非html页面会报错
  }

  const clientCompiler = clientWatcher.compiler;
  const serverComplier = serverWatcher.compiler
  const compiledPromise = {};

  return async function (req, res, next) {
    try {
      const name = req.path.slice(1);
      const isPage = !!pageEntries[name];

      // 非入口页面
      if (!isPage) {
        return next();
      }

      if (!compiledPromise[name]) {
        console.log(`${name} is building ...`);
        // 添加server端入口
        recoverEntryContent(pageEntries[name]);

        const invalidateClientWatcherPromise = (() => {
          return new Promise((resolve, reject) => {
            clientWatcher.invalidate((err) => {
              if (err) {
                delete clientCompiler.compiledEntries[name];
                reject(err);
              } else {
                resolve();
              }
            });
          });
        })();

        const afterEmitClientPromise = (() => {
          return new Promise((resolve, reject) => {
            clientCompiler.hooks.afterEmit.tap("emit complete", () => {

              resolve();

            });
          });
        })();

        const afterEmitServerPromise = (() => {
          return new Promise((resolve, reject) => {
            serverComplier.hooks.afterEmit.tap("emit complete", () => {
              resolve();
            });
          });
        })();

        compiledPromise[name] = Promise.all([
          invalidateClientWatcherPromise,
          afterEmitClientPromise,
          afterEmitServerPromise
        ]);
      }

      await compiledPromise[name];

      next();
    } catch (e) {
      next();
    }
  };
};

module.exports = { createDemandEntryMiddleware };
