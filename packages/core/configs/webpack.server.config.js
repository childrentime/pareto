const nodeExternals = require("webpack-node-externals");
const path = require("path");
const babelConfig = require("./babel.config");
const { getServerEntry } = require("./entry");
const rspack = require("@rspack/core");

const cwd = process.cwd();

const styleLoader = { loader: require.resolve("../useStyles/loader/index.js") };

const cssLoader = (modules) => {
  return {
    loader: require.resolve("css-loader"),
    options: {
      importLoaders: 1,
      modules: modules
        ? {
            localIdentName:
              process.env.NODE_ENV === "development"
                ? "[local]-[hash:base64:5]"
                : "[hash:base64:8]",
          }
        : "global",
      sourceMap: true,
      esModule: false,
    },
  };
};

const sassLoader = {
  loader: require.resolve("sass-loader"),
};

const postCssLoader = {
  loader: require.resolve("postcss-loader"),
};

const moduleScssReg = /\.(module|iso|mjs)\.scss$/;

const APP_PATH = path.resolve(cwd, "dist/server/");

const /**
   * @type {import("webpack").Configuration}
   */ serverConfig = {
    mode: process.env.NODE_ENV || "development",
    node: false,
    entry: {
      index: [getServerEntry(), path.resolve(cwd, "./server-entry.tsx")],
    },
    output: {
      path: path.resolve(cwd, "dist/server/"),
      libraryTarget: "commonjs2",
      chunkFilename: "[id].chunk.js",
    },
    target: `node${process.versions.node.split(".").slice(0, 2).join(".")}`,
    devtool: "eval-cheap-module-source-map",
    module: {
      rules: [
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
          use: [styleLoader, cssLoader(), postCssLoader],
          exclude: /\.module\.css$/,
        },
        {
          test: /\.scss$/,
          use: [styleLoader, cssLoader(), postCssLoader, sassLoader],
          exclude: moduleScssReg,
        },
        {
          test: /\.module\.css$/,
          use: [styleLoader, cssLoader(true), postCssLoader],
        },
        {
          test: moduleScssReg,
          use: [styleLoader, cssLoader(true), postCssLoader, sassLoader],
        },
      ],
    },
    optimization: {
      minimize: false,
    },
    externals: [nodeExternals()],
    resolve: {
      extensions: [".js", ".jsx", ".json", ".mjs", ".wasm", ".ts", ".tsx"],
    },
    cache: true,
    plugins: [
      new rspack.ProgressPlugin({
        prefix: "server",
      }),
    ],
  };

module.exports = { serverConfig, APP_PATH };
