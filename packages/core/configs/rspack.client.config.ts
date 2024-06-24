import type { Configuration } from '@rspack/core'
import rspack from '@rspack/core'
import AssetsPlugin from 'assets-webpack-plugin'
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer'
import WebpackDemandEntryPlugin from '../cmd/dev/lazy-compiler/plugin'
import { CLIENT_OUTPUT_PATH } from '../constant'
import { __ANA__, __DEV__ } from '../utils/node-env'
import babelConfig from './babel.config'
import { getClientEntries, pageEntries } from './entry'
import pageConfig from './page.config'
import { generateCssLoaders, spiltChunks } from './rspack.base'

const defaultConfig: Configuration = {
  mode: __DEV__ ? 'development' : 'production',
  node: false,
  entry: getClientEntries(),
  output: {
    path: CLIENT_OUTPUT_PATH,
    filename: 'assets/js/[name].bundle.js',
    chunkFilename: 'assets/js/[id].chunk.js',
    publicPath: '/',
  },
  devtool: __DEV__ ? 'eval-cheap-module-source-map' : 'source-map',
  module: {
    rules: [
      {
        test: /\.svg$/,
        type: 'asset',
      },
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: require.resolve('babel-loader'),
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
    extensions: ['.js', '.jsx', '.json', '.mjs', '.wasm', '.ts', '.tsx'],
  },
  // @ts-ignore
  plugins: [
    new AssetsPlugin({
      path: CLIENT_OUTPUT_PATH,
      entrypoints: true,
    }),
    new rspack.ProgressPlugin({ prefix: 'client' }),
    new rspack.CssExtractRspackPlugin({}),
    __DEV__ &&
      new WebpackDemandEntryPlugin({
        pageEntries,
      }),
    __ANA__ && new BundleAnalyzerPlugin(),
    new rspack.DefinePlugin({
      'typeof window': JSON.stringify('object'),
    }),
    !__DEV__ &&
      new rspack.SourceMapDevToolPlugin({
        filename: 'sourcemaps/[file].map',
      }),
  ].filter(Boolean),
  cache: false,
  experiments: {
    css: false,
  },
  ...spiltChunks,
}

const clientConfig: Configuration = pageConfig.configureRspack!(defaultConfig, {
  isServer: false,
})

export { clientConfig }
