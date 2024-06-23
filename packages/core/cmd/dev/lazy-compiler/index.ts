import type { Request, Response, NextFunction } from "express";
import type { Watching } from '@rspack/core'
import { recoverEntryContent } from "./replace";
import fs from "fs-extra";
import { ASSETS_PATH } from "../../../constant";
import type { EntryCompiler } from "./plugin";

const createDemandEntryMiddleware = ({
  clientWatcher,
  pageEntries,
  serverWatcher,
}: {
  clientWatcher: Watching;
  pageEntries: any;
  serverWatcher: Watching;
}) => {
  if (!fs.existsSync(ASSETS_PATH)) {
    fs.createFileSync(ASSETS_PATH);
    fs.writeFileSync(ASSETS_PATH, "{}"); // 兜下底，访问了非html页面会报错
  }

  const clientCompiler = clientWatcher.compiler as EntryCompiler;
  const serverComplier = serverWatcher.compiler as EntryCompiler;
  const compiledPromise = {} as Record<string, Promise<any>>;

  return async function (req: Request, res: Response, next: NextFunction) {
    try {
      const name = req.path.slice(1);
      const isPage = !!pageEntries[name];

      // 非入口页面
      if (!isPage) {
        return next();
      }

      if (!compiledPromise[name]) {
        console.log(`${name} is building ...`);
        recoverEntryContent(pageEntries[name]);

        clientCompiler.compiledEntries[name] = clientCompiler.allEntries[name];

        const invalidateClientWatcherPromise = (() => {
          return new Promise<void>((resolve, reject) => {
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
          return new Promise<void>((resolve, reject) => {
            clientCompiler.hooks.afterEmit.tap("emit complete", () => {
              resolve();
            });
          });
        })();

        const afterEmitServerPromise = (() => {
          return new Promise<void>((resolve, reject) => {
            serverComplier.hooks.afterEmit.tap("emit complete", () => {
              resolve();
            });
          });
        })();

        compiledPromise[name] = Promise.all([
          invalidateClientWatcherPromise,
          afterEmitClientPromise,
          afterEmitServerPromise,
        ]);
      }

      await compiledPromise[name];

      next();
    } catch (e) {
      next();
    }
  };
};

export { createDemandEntryMiddleware };
