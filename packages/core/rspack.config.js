// @ts-check
const { rspack } = require("@rspack/core");
const path = require("path");
const __DEV__ = process.env.NODE_ENV === "development";
/**
 * @type {import("@rspack/core").Configuration}
 */
const config = {
  entry: {
    main: "./main.ts",
    client: "./client.ts",
    node: "./node.ts"
  },
  optimization: {
    minimize: false,
  },
  node: false,
  output: {
    path: path.resolve(__dirname, "dist"),
    libraryTarget: "commonjs",
  },
  resolve: {
    extensions: [".ts", ".js", ".tsx","json"],
  },
  externals: {
    react: "commonjs react",
    "react/jsx-runtime": "commonjs react/jsx-runtime",
    "react/jsx-dev-runtime": "commonjs react/jsx-dev-runtime",
    "react-dom": "commonjs react-dom",
    "react-dom/server": "commonjs react-dom/server",
    "react-helmet-async": "commonjs react-helmet-async",
    "@paretojs/monitor": "commonjs @paretojs/monitor",
    "express": "commonjs express",
  },
  externalsPresets: {
    node: true,
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: require.resolve("babel-loader"),
            options: {
              presets: [
                "@babel/preset-env",
                [
                  "@babel/preset-react",
                  {
                    runtime: "automatic",
                  },
                ],
                "@babel/preset-typescript",
              ],
            },
          },
        ],
      },
    ],
  },
};

const compiler = rspack(config);

if (__DEV__) {
  compiler.watch(
    {
      aggregateTimeout: 300,
      poll: undefined,
    },
    (err, stats) => {
      console.log(stats?.toString());
    }
  );
} else {
  compiler.run((err, stats) => {
    console.log(stats?.toString());
  });
}
