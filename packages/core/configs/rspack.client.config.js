const AssetsPlugin = require("assets-webpack-plugin");
const babelConfig = require("./babel.config");
const { getClientEntries } = require("./entry");

const runner = process.env.runner || "webpack";
const useWebpack = runner === 'webpack';
const rspack = useWebpack ? require('webpack') :  require("@rspack/core");

const { generateCssLoaders } = require("./rspack.base");
const WebpackDemandEntryPlugin = require("../cmd/dev/lazy-compiler/plugin");
const { pageEntries } = require("./entry");
const { CLIENT_OUTPUT_PATH } = require("../constant");
const pageConfig = require("./page.config");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

/**
 * @type {import("webpack").Configuration}
 */
const defaultConfig = {
  mode: process.env.NODE_ENV || "development",
  node: false,
  entry: getClientEntries(),
  output: {
    path: CLIENT_OUTPUT_PATH,
    filename: "assets/js/[name].bundle.js",
    chunkFilename: "assets/js/[id].chunk.js",
    publicPath: "/",
  },
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
        use: [
          {
            loader: require.resolve("babel-loader"),
            options: babelConfig(true),
          },
        ],
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
  resolve: {
    extensions: [".js", ".jsx", ".json", ".mjs", ".wasm", ".ts", ".tsx"],
  },
  plugins: [
    new AssetsPlugin({
      path: CLIENT_OUTPUT_PATH,
      entrypoints: true,
    }),
    // new rspack.ProgressPlugin({ prefix: "client" }),
    useWebpack ? new MiniCssExtractPlugin() : new rspack.CssExtractRspackPlugin({}),
    new WebpackDemandEntryPlugin({
      pageEntries,
    }),
  ],
  cache: true,
  experiments: {
    css: false,
  },
};

const clientConfig = pageConfig.configureRspack(defaultConfig, {
  isServer: false,
});
module.exports = { clientConfig };
