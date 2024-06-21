import express from "express";
import { paretoRequestHandler } from "@paretojs/core/node";
import { sleep } from "./utils";
import i18n from "./i18n";
import Backend from 'i18next-fs-backend';
import fs from 'fs';
import { I18nextProvider } from 'react-i18next'; 
import path from 'path';
const i18nextMiddleware = require('i18next-http-middleware');

const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = (relativePath: string) => path.resolve(appDirectory, relativePath);
const appSrc = resolveApp('app');

const initI18n = (path: string) => {
  return new Promise((resolve, reject) => {
    i18n
      .use(Backend)
      .use(i18nextMiddleware.LanguageDetector)
      .init({
        debug: false,
        preload: ['en', 'de'],
        ns: ['translations'],
        defaultNS: 'translations',
        backend: {
          loadPath: `${appSrc}/locales/{{lng}}/{{ns}}.json`,
          addPath: `${appSrc}/locales/{{lng}}/{{ns}}.missing.json`,
        },
      }, (err, t) => {
        if (err) return reject(err);
        resolve(t);
      });
  });
};

const app = express();

const ABORT_DELAY = 5_000;

app.use("/api/repositories", async (req, res) => {
  await sleep(500);
  res.json({
    repositories: [
      {
        name: "childrentime/reactuse",
        avatar: "https://avatars.githubusercontent.com/u/58261676?s=16&v=4",
      },
      {
        name: "childrentime/pareto",
        avatar: "https://avatars.githubusercontent.com/u/58261676?s=16&v=4",
      },
      {
        name: "FormidableLabs/react-live",
        avatar: "https://avatars.githubusercontent.com/u/5078602?s=16&v=4",
      },
    ],
  });
});

app.use("/api/recommends", async (req, res) => {
  await sleep(3000);
  res.json({
    feeds: [
      {
        name: "vesple",
        avatar: "https://avatars.githubusercontent.com/u/70858606?s=80&v=4",
        time: "yesterday",
        action: "starred your repository",
        repositoryName: "antfu/vscode-browse-lite",
        repositoryAvatar:
          "https://avatars.githubusercontent.com/u/11247099?s=40&v=4",
        desc: "🚀 An embedded browser in VS Code",
      },
      {
        name: "vesple",
        avatar: "https://avatars.githubusercontent.com/u/70858606?s=80&v=4",
        time: "yesterday",
        action: "starred your repository",
        repositoryName: "antfu/vscode-browse-lite",
        repositoryAvatar:
          "https://avatars.githubusercontent.com/u/11247099?s=40&v=4",
        desc: "🚀 An embedded browser in VS Code",
      },
      {
        name: "vesple",
        avatar: "https://avatars.githubusercontent.com/u/70858606?s=80&v=4",
        time: "yesterday",
        action: "starred your repository",
        repositoryName: "antfu/vscode-browse-lite",
        repositoryAvatar:
          "https://avatars.githubusercontent.com/u/11247099?s=40&v=4",
        desc: "🚀 An embedded browser in VS Code",
      },
    ],
  });
});

app.get("*", paretoRequestHandler({ delay: ABORT_DELAY }));

export { app };
