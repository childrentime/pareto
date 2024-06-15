const path = require("path");
const babelConfig = require("./babel.config");
const { getServerEntry } = require("./entry");
const rspack = require("@rspack/core");

const cwd = process.cwd();
const { generateCssLoaders, spiltChunks } = require("./rspack.base");

const { APP_PATH } = require("../constant");
const WebpackDemandEntryPlugin = require("../cmd/dev/lazy-compiler/plugin");
const { pageEntries } = require("./entry");
const pageConfig = require("./page.config");
const { __DEV__ } = require("../utils/node-env");
const nodeExternals = require("webpack-node-externals");

/**
 * @type {import("webpack").Configuration}
 */
const defaultConfig = {
  mode: __DEV__ ? "development" : "production",
  node: false,
  entry: {
    index: [getServerEntry(), path.resolve(cwd, "./server-entry.tsx")],
  },
  target: "node",
  externals: [nodeExternals()],
  output: {
    path: APP_PATH,
    libraryTarget: "commonjs2",
    chunkFilename: "[id].chunk.js",
  },
  target: `node${process.versions.node.split(".").slice(0, 2).join(".")}`,
  devtool: "eval-cheap-module-source-map",
  module: {
    rules: [
      {
        test: /\.svg$/,
        type: "asset",
      },
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: require.resolve("babel-loader"),
          options: babelConfig(false),
        },
      },
      {
        test: /\.css$/,
        exclude: /\.module\.css$/,
        use: generateCssLoaders(),
      },
      {
        test: /\.module\.css$/,
        use: generateCssLoaders({ useModules: true }),
      },
      {
        test: /\.scss$/,
        exclude: [/\.module\.scss$/, /\.iso\.scss$/],
        use: generateCssLoaders({ useSass: true }),
      },
      {
        test: /\.module\.scss$/,
        exclude: /\.iso\.scss$/,
        use: generateCssLoaders({ useModules: true, useSass: true }),
      },
      {
        test: /\.iso\.scss$/,
        use: generateCssLoaders({
          useStyle: true,
          useSass: true,
          useModules: true,
        }),
      },
    ],
  },
  optimization: {
    minimize: false,
  },
  resolve: {
    extensions: [".js", ".jsx", ".json", ".mjs", ".wasm", ".ts", ".tsx"],
  },
  plugins: [
    new rspack.ProgressPlugin({ prefix: "server" }),
    __DEV__ &&
      new WebpackDemandEntryPlugin({
        pageEntries,
      }),
    new rspack.DefinePlugin({
      'typeof window': JSON.stringify('undefined')
    }),
  ],
  cache: false,
  experiments: {
    css: false,
  },
  ...spiltChunks,
  performance: {
    hints: false,
  }
};

const serverConfig = pageConfig.configureRspack(defaultConfig, {
  isServer: true,
});

module.exports = { serverConfig };
