import { renderToString } from "react-dom/server";
import express from "express";
import { pageEntries } from "../core/configs/entry";
import { getConfig } from "../core/configs/runtime.config";
const app = express();

app.get("*", async (req, res) => {
  const { url } = req;
  const path = url.split("/").pop()!.split(".")[0];

  if (!pageEntries[path]) {
    return;
  }

  const { assets, pages, header } = getConfig();

  const Page = pages[path];

  const asset = assets[path] as {
    js: string[] | string;
  };

  const jsx = <Page />;

  const html = renderToString(jsx);

  res.end(html);
});

export { app };
