import { rspack } from "@rspack/core";
import { serverConfig } from "../../configs/rspack.server.config";
import { clientConfig } from "../../configs/rspack.client.config";
import path from "path";
import fs from "fs-extra";
import { DIST_PATH } from "../../constant";

const cwd = process.cwd();

const build = () => {
  const clientCompiler = rspack(clientConfig);
  const serverCompiler = rspack(serverConfig);
  clientCompiler.run((err, stats) => {
    if (err) {
      console.error("client webpack error", err);
      return;
    }
    console.log(stats?.toString());

    serverCompiler.run((err, stats) => {
      if (err) {
        console.error("server webpack error", err);
        return;
      }
      console.log(stats?.toString());
    });
  });
  fs.copy(path.resolve(cwd, "public"), path.resolve(DIST_PATH, "public"));
  fs.copyFileSync(
    path.resolve(__dirname, "../bin/start.js"),
    path.resolve(DIST_PATH, "index.js")
  );
};

export { build };
