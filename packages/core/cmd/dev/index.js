const express = require("express");
const rspack = require("@rspack/core");
const { serverConfig } = require("../../configs/rspack.server.config");
const clearModule = require("clear-module");
const webpackDevMiddleware = require("webpack-dev-middleware");
const webpackHotMiddleware = require("webpack-hot-middleware");
const ReactRefreshPlugin = require("@rspack/plugin-react-refresh");
const { clientConfig } = require("../../configs/rspack.client.config");
const path = require("path");
const { createDemandEntryMiddleware } = require("./lazy-compiler");
const { pageEntries } = require("../../configs/entry");
const { APP_PATH, CLIENT_OUTPUT_PATH } = require("../../constant");

const port = process.env.PORT || 4000;
const cwd = process.cwd();

const hotMiddlewareScript = `${require.resolve(
  "webpack-hot-middleware/client"
)}?path=/__webpack_hmr&timeout=20000&reload=true&noInfo=true`;

const dev = async () => {
  const server = express();

  process.on("uncaughtException", (e) => {
    console.error("uncaughtException", e);
  });
  process.on("unhandledRejection", (e) => {
    console.info("unhandledRejection:", e);
  });

  clientConfig.plugins.push(new rspack.HotModuleReplacementPlugin());
  Object.keys(clientConfig.entry).forEach(function (name) {
    clientConfig.entry[name].unshift(hotMiddlewareScript);
  });
  clientConfig.plugins.push(new ReactRefreshPlugin());

  /**
   * @type {import("@rspack/core").Compiler}
   */
  const clientCompiler = rspack(clientConfig);

  /**
   * @type {import("@rspack/core").Watching}
   */
  const serverWatcher = rspack(serverConfig).watch(
    { aggregateTimeout: 300 },
    (errors, stats) => {
      const error = errors || stats.compilation.errors;
      if (error && error.length) {
        console.log(error);
        throw errors;
      } else {
        console.log(stats.toString());
      }
    }
  );

  const devMiddleware = webpackDevMiddleware(clientCompiler, {
    publicPath: "/",
    writeToDisk(filePath) {
      return /\webpack-assets.json?$/.test(filePath);
    },
    stats: {
      all: false,
      env: true,
      errors: true,
      errorDetails: true,
      timings: true,
    },
  });

  const hotMiddleware = webpackHotMiddleware(clientCompiler, {
    log: (message) => {
      console.log("HMR LOGGER: ", message);
    },
    heartbeat: 2000,
  });

  server.use("/", express.static(CLIENT_OUTPUT_PATH));
  server.use("/", express.static(path.join(cwd, "./public")));
  server.use(devMiddleware);
  server.use(hotMiddleware);
  server.use(
    createDemandEntryMiddleware({
      pageEntries,
      clientWatcher: clientCompiler.watching,
      serverWatcher,
    })
  );
  server.use("/", (req, res, next) => {
    clearModule(APP_PATH);
    const app = require(APP_PATH).app;
    app.handle(req, res, next);
  });

  server.listen(port, () => {
    console.log(`server is listening on port: http://localhost:${port}`);
  });
};

module.exports = {
  dev,
};
