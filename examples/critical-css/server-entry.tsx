import { renderToPipeableStream } from "react-dom/server";
import express from "express";
import App from "./root";
import { getRuntimeConfig, pageEntries } from "@pareto/core/node";
import { sleep } from "./utils";
import { ISOStyle, StyleContext } from "@pareto/core";
import { Transform } from "stream";

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

app.get("*", async (req, res) => {
  const path = req.path.slice(1);
  if (!pageEntries[path]) {
    return;
  }

  const { pages, assets } = getRuntimeConfig();
  const asset = assets[path];
  const { js, css } = asset;
  const jsArr = typeof js === "string" ? [js] : [...(js || [])];
  const cssArr = typeof css === "string" ? [css] : [...(css || [])];

  const preloadJS = jsArr.map((js) => {
    return <link rel="preload" href={js} as="script" key={js} />;
  });
  const loadedCSS = cssArr.map((css) => {
    return <link rel="stylesheet" href={css} type="text/css" key={css} />;
  });
  const loadedJs = jsArr.map((js) => {
    return <script src={js} async key={js} />;
  });

  const Page = pages[path];
  const initialData = await Page.getServerSideProps?.(req, res);

  const criticalCssMap = new Map<string,string>()
  const insertCss = (styles: ISOStyle[]) => styles.forEach(style => {
    criticalCssMap.set(style._getHash(), style._getContent());
  })

  const { pipe, abort } = renderToPipeableStream(
    // @ts-ignore react 19
    <StyleContext value={{ insertCss }}>
      <App
        Page={Page}
        Links={[...loadedCSS, ...preloadJS]}
        Scripts={loadedJs}
        initialData={initialData}
      />
    </StyleContext>,
    {
      onShellReady() {
        let injected = false;
        const styles = [...criticalCssMap.keys()].map(key => {
          return `<style id="${key}">${criticalCssMap.get(key)}</style>`;
        }).join("\n");
        const injectableTransform = new Transform({
          transform(chunk, encoding, callback) {
            if (!injected) {
              let html = chunk.toString();
              const headCloseTagIndex = html.indexOf("</head>");

              if (headCloseTagIndex !== -1) {
                html =
                  html.slice(0, headCloseTagIndex) +
                  styles +
                  html.slice(headCloseTagIndex);
                injected = true;
              }
              this.push(html);
            }else {
              this.push(chunk);
            }
            callback();
          },
        });

        pipe(injectableTransform).pipe(res);
      },
    }
  );
  setTimeout(() => {
    abort();
  }, ABORT_DELAY);
});

export { app };
