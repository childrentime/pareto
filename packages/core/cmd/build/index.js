const rspack = require("@rspack/core");
const { serverConfig } = require("../../configs/rspack.server.config");
const { clientConfig } = require("../../configs/rspack.client.config");
const path = require("path");
const fs = require("fs-extra");
const cwd = process.cwd();
const { DIST_PATH } = require("../../constant");

const build = () => {
  /** @type {import("@rspack/core").Compiler} */
  const clientCompiler = rspack(clientConfig);
  /** @type {import("@rspack/core").Compiler} */
  const serverCompiler = rspack(serverConfig);
  clientCompiler.run((err, stats) => {
    if (err) {
      console.error("client webpack error", err);
      return;
    }
    console.log(stats.toString());

    serverCompiler.run((err, stats) => {
      if (err) {
        console.error("server webpack error", err);
        return;
      }
      console.log(stats.toString());
    });
  });
  fs.copy(path.resolve(cwd, "public"), path.resolve(DIST_PATH, "public"));
  fs.copyFileSync(
    path.resolve(__dirname, "./start.js"),
    path.resolve(DIST_PATH, "index.js")
  );
};

module.exports = {
  build,
};
