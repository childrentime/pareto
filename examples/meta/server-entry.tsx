import express from "express";
import {
  paretoRequestHandler,
} from "@pareto/core/node";
import { sleep } from "./utils";
import { HelmetProvider } from "@pareto/core";

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

app.get(
  "*",
  paretoRequestHandler({
    delay: ABORT_DELAY,
    pageWrapper: (Page) => {
      const helmetContext = {} as any;
      return {
        page: (props) => (
          // @ts-ignore react19
          <HelmetProvider context={helmetContext}>
            <Page {...props} />
          </HelmetProvider >
        ),
        helmetContext,
      };
    },
  })
);

export { app };
