import MiniCssExtractPlugin from "mini-css-extract-plugin";
import path from "path";
import webpack from "webpack";
import  NpmDtsPlugin from 'npm-dts-webpack-plugin'

const outputDir = path.resolve(__dirname, "dist");

const common: webpack.Configuration = {
  entry: "./src/index.ts",
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              "@babel/preset-env",
              "@babel/preset-react",
              "@babel/preset-typescript",
            ],
          },
        },
      },
      {
        test: /\.module\.s(a|c)ss$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: "css-loader",
            options: {
              modules: {
                localIdentName: "[name]__[local]___[hash:base64:5]",
                namedExport: false
              },
            },
          },
          "sass-loader",
        ],
      },
      {
        test: /\.s(a|c)ss$/,
        exclude: /\.module.(s(a|c)ss)$/,
        use: ["style-loader", "css-loader", "sass-loader"],
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "[name].css",
      chunkFilename: "[id].css",
    }),
    new NpmDtsPlugin(),
  ],
  resolve: {
    extensions: [".ts", ".tsx", ".scss"],
  },
};

const cjsConfig: webpack.Configuration = {
  ...common,
  output: {
    filename: "main.js",
    path: outputDir,
    library: {
      type: "commonjs2",
    },
  },
};

const esmConfig: webpack.Configuration = {
  ...common,
  output: {
    filename: "main.mjs",
    path: outputDir,
    library: {
      type: "module",
    },
    module: true,
  },
  experiments: {
    outputModule: true,
  },
};

export default [cjsConfig, esmConfig];
