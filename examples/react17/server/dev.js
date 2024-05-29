const path = require("path");
const cwd = process.cwd();
const dist = path.resolve(cwd, ".pareto");
const fs = require("fs-extra");
const express = require("express");
const rspack = require("@rspack/core");

const clearModule = require("clear-module");
const webpackDevMiddleware = require("webpack-dev-middleware");
const webpackHotMiddleware = require("webpack-hot-middleware");
const ReactRefreshPlugin = require("@rspack/plugin-react-refresh");

const { APP_PATH } = require("../constant");

if (fs.existsSync(dist)) {
  fs.removeSync(dist);
}
fs.ensureDirSync(dist);

const { serverConfig } = require("../configs/rspack.server.config");
const { clientConfig } = require("../configs/rspack.client.config");

const port = process.env.PORT || 4000;
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

  rspack(serverConfig).watch({ aggregateTimeout: 300 }, (errors, stats) => {
    const error = errors || stats.compilation.errors;
    if (error && error.length) {
      console.log(error);
      throw errors;
    } else {
      console.log(stats.toString());
    }
  });

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

  server.use("/", express.static(path.join(cwd, "./.pareto/client")));
  server.use("/", express.static(path.join(cwd, "./public")));
  server.use(devMiddleware);
  server.use(hotMiddleware);
  server.use("/", (req, res, next) => {
    clearModule(APP_PATH);
    const app = require(APP_PATH).app;
    app.handle(req, res, next);
  });

  server.listen(port, () => {
    console.log(`server is listening on port: http://localhost:${port}`);
  });
};

dev();
