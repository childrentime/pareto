// @ts-check
const { rspack } = require("@rspack/core");
const path = require("path");
/**
 * @type {import("@rspack/core").Configuration}
 */
const config = {
  entry: {
    main: "./main.ts",
    client: "./client.ts",
    node: "./node.ts",
  },
  node: false,
  output: {
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'commonjs'
  },
  resolve: {
    extensions: [".ts", ".js", ".tsx"],
  },
  externals: {
    react: 'commonjs react',
    'react-dom': 'commonjs react-dom',
    'react-dom/server': 'commonjs react-dom/server',
    'react-helmet-async': 'commonjs react-helmet-async',
    '@paretojs/monitor': 'commonjs @paretojs/monitor',
    superjson: 'commonjs superjson'
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

compiler.watch(
  {
    // 示例
    aggregateTimeout: 300,
    poll: undefined,
  },
  (err, stats) => {
    console.log(stats?.toString());
  }
);
