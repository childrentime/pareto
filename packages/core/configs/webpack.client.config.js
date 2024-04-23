const AssetsPlugin = require("assets-webpack-plugin");
const path = require("path");
const babelConfig = require("./babel.config");
const { getClientEntries } = require("./entry");
const rspack = require("@rspack/core");
const cwd = process.cwd();
const ReactRefreshWebpackPlugin = require("@rspack/plugin-react-refresh");

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

const styleLoader = { loader: require.resolve("../useStyles/loader/index.js") };

const /**
   * @type {import("webpack").Configuration}
   */ clientConfig = {
    context: cwd,
    mode: process.env.NODE_ENV || "development",
    node: false,
    entry: getClientEntries(),
    output: {
      path: path.resolve(cwd, "dist"),
      filename: "assets/js/[name].bundle.js",
      chunkFilename: "assets/js/[id].chunk.js",
      publicPath: "/",
    },
    devtool: "eval-cheap-module-source-map",
    module: {
      rules: [
        {
          test: /\.(js|jsx|ts|tsx)$/,
          exclude: /node_modules/,
          use: [
            {
              loader: require.resolve("babel-loader"),
              options: babelConfig(true),
            },
            // {
            //   loader: "builtin:swc-loader",
            //   options: {
            //     jsc: {
            //       parser: {
            //         syntax: "typescript",
            //         tsx: true,
            //       },
            //       transform: {
            //         react: {
            //           runtime: "automatic",
            //           development: true,
            //           refresh: true,
            //         },
            //       },
            //     },
            //   },
            // },
          ],
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
    resolve: {
      extensions: [".js", ".jsx", ".json", ".mjs", ".wasm", ".ts", ".tsx"],
    },
    plugins: [
      new rspack.ProgressPlugin({
        prefix: "client",
      }),
      new AssetsPlugin({
        path: path.join(cwd, "dist"),
        entrypoints: true,
      }),
      new rspack.HotModuleReplacementPlugin(),
      new ReactRefreshWebpackPlugin(),
    ],
    cache: true,
  };

module.exports = { clientConfig };
