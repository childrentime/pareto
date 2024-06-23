import { Configuration } from "@rspack/core";

import path from "path";
import babelConfig from "./babel.config";
import { getServerEntry } from "./entry";
import rspack from "@rspack/core";
import { generateCssLoaders, spiltChunks } from "./rspack.base";
import { APP_PATH } from "../constant";
import WebpackDemandEntryPlugin from "../cmd/dev/lazy-compiler/plugin";
import { pageEntries } from "./entry";
import pageConfig from "./page.config";
import { __DEV__ } from "../utils/node-env";
import nodeExternals from "webpack-node-externals";

const cwd = process.cwd();
const defaultConfig: Configuration = {
  mode: __DEV__ ? "development" : "production",
  node: false,
  entry: {
    index: [getServerEntry(), path.resolve(cwd, "./server-entry.tsx")],
  },
  target: 'node',
  // @ts-ignore
  externals: [nodeExternals()],
  output: {
    path: APP_PATH,
    libraryTarget: "commonjs2",
    chunkFilename: "[id].chunk.js",
  },
  devtool: __DEV__ ? "eval-cheap-module-source-map" : "source-map",
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
  // @ts-ignore
  plugins: [
    new rspack.ProgressPlugin({ prefix: "server" }),
    __DEV__ &&
      new WebpackDemandEntryPlugin({
        pageEntries,
      }),
    new rspack.DefinePlugin({
      'typeof window': JSON.stringify('undefined')
    }),
  ].filter(Boolean),
  cache: false,
  experiments: {
    css: false,
  },
  ...spiltChunks,
};

const serverConfig: Configuration = pageConfig.configureRspack!(defaultConfig, {
  isServer: true,
});

export { serverConfig };
