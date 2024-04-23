const express = require("express");
const rspack = require("@rspack/core");
const { APP_PATH, serverConfig } = require("../configs/webpack.server.config");
const clearModule = require("clear-module");
const webpackDevMiddleware = require("webpack-dev-middleware");
const webpackHotMiddleware = require("webpack-hot-middleware");
const { clientConfig } = require("../configs/webpack.client.config");
const path = require("path");
const { createProxyMiddleware } = require('http-proxy-middleware');

const port = process.env.PORT || 4000;
const cwd = process.cwd();

const hotMiddlewareScript = `${require.resolve('webpack-hot-middleware/client')}?path=/__webpack_hmr&timeout=20000&reload=true&noInfo=true`;

const dev = () => {
  let app;
  let initialized = false;
  const server = express();

  process.on("uncaughtException", (e) => {
    console.error("uncaughtException", e);
  });
  process.on("unhandledRejection", (e) => {
    console.info("unhandledRejection:", e);
  });

  Object.keys(clientConfig.entry).forEach(function (name) {
    console.log('entry', clientConfig.entry)
    clientConfig.entry[name].unshift(hotMiddlewareScript);
  });

  const clientCompiler = rspack(clientConfig);

  const devMiddleware = webpackDevMiddleware(clientCompiler, {
    headers: { "Access-Control-Allow-Origin": "*" },
    index: true,
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

  server.use("/", express.static(path.join(cwd, "./dist")));
  server.use("/", express.static(path.join(cwd, "./public")));
  server.use(devMiddleware);
  server.use(hotMiddleware);

  server.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:1010',
      changeOrigin: true,
      logLevel: 'debug', // 增加日志等级以便于调试
      onProxyReq: function (proxyReq, req, res) {
        console.log('Proxy request sent to:', proxyReq.path);
      },
      pathRewrite: (path) => path.replace(/^\/api/, '')
    })
  );

  rspack(serverConfig).watch({ aggregateTimeout: 300 }, (errors, stats) => {
    console.log(stats.toString())
    const error = errors || stats.compilation.errors;
    if (error && error.length) {
      console.log(error);
      throw errors;
    } else {
      console.log(stats.toString());
    }

    if (initialized) {
      clearModule(APP_PATH);
      app = require(APP_PATH).app;

      console.log(`server is listening on port: http://localhost:${port}`);
    } else {
      console.log(`starting app at ${new Date().toLocaleString()}`);

      app = require(APP_PATH).app;

      server.use((req, res, next) => {
        app.handle(req, res, next);
      });

      server.listen(port, () => {
        console.log(`server is listening on port: http://localhost:${port}`);
      });

      initialized = true;
    }
  });
};

module.exports = {
  dev,
};
