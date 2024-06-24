import rspack from '@rspack/core'
import { __DEV__ } from '../utils/node-env'

const sassLoader = {
  loader: require.resolve('sass-loader'),
}

const cssLoader = (modules?: boolean) => {
  return {
    loader: require.resolve('css-loader'),
    options: {
      importLoaders: 2,
      modules: modules
        ? {
            localIdentName: __DEV__
              ? '[local]-[hash:base64:5]'
              : '[hash:base64:8]',
            namedExport: false,
            mode: 'local',
          }
        : 'global',
      sourceMap: true,
      esModule: false,
    },
  }
}

const postCssLoader = {
  loader: require.resolve('postcss-loader'),
}

const styleLoader = { loader: require.resolve('../useStyles/loader/index.js') }

const generateCssLoaders = (
  {
    useModules,
    useStyle,
    useSass,
  }: {
    useModules?: boolean
    useStyle?: boolean
    useSass?: boolean
  } = {
    useModules: false,
    useStyle: false,
    useSass: false,
  },
) => {
  const loaders = [
    useStyle ? styleLoader : rspack.CssExtractRspackPlugin.loader,
    cssLoader(useModules),
    postCssLoader,
  ]

  if (useSass) {
    loaders.push(sassLoader)
  }

  return loaders
}

const spiltChunks: rspack.Configuration = {
  optimization: __DEV__
    ? {}
    : {
        splitChunks: {
          chunks: 'all',
          maxAsyncRequests: Infinity,
          maxInitialRequests: Infinity,
          minSize: 0,
          cacheGroups: {
            default: false,
            defaultVendors: false,
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendor',
              chunks: 'initial',
              reuseExistingChunk: true,
            },
            paretojs: {
              test: function (module) {
                const m = module.resource
                if (
                  m &&
                  (m.includes('pareto/packages/core') ||
                    m.includes('@paretojs'))
                ) {
                  return true
                }
                return false
              },
              name: 'paretojs',
              chunks: 'initial',
              reuseExistingChunk: true,
            },
          },
        },
      },
}

export { generateCssLoaders, spiltChunks }
