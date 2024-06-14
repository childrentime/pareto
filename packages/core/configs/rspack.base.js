const rspack = require("@rspack/core");
const { __DEV__ } = require("../utils/node-env");

const sassLoader = {
  loader: require.resolve("sass-loader"),
};

const cssLoader = (modules) => {
  return {
    loader: require.resolve("css-loader"),
    options: {
      importLoaders: 2,
      modules: modules
        ? {
            localIdentName: __DEV__
              ? "[local]-[hash:base64:5]"
              : "[hash:base64:8]",
            namedExport: false,
            mode: "local",
          }
        : "global",
      sourceMap: true,
      esModule: false,
    },
  };
};

const postCssLoader = {
  loader: require.resolve("postcss-loader"),
};

const styleLoader = { loader: require.resolve("../useStyles/loader/index.js") };

const generateCssLoaders = (
  { useModules, useStyle, useSass } = {
    useModules: false,
    useStyle: false,
    useSass: false,
  }
) => {
  let loaders = [
    useStyle ? styleLoader : rspack.CssExtractRspackPlugin.loader,
    cssLoader(useModules),
    postCssLoader,
  ];

  if (useSass) {
    loaders.push(sassLoader);
  }

  return loaders;
};

/**
 * @type {import("@rspack/core").Configuration}
 */
const spiltChunks = {
  optimization: {
    splitChunks: {
      chunks: "all",
      maxAsyncRequests: Infinity,
      maxInitialRequests: Infinity,
      minSize: 0,
      cacheGroups: {
        default: false,
        defaultVendors: false,
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendor",
          chunks: "initial",
          reuseExistingChunk: true,
        },
        paretojs: {
          test: function (module) {
            const m = module.resource;
            if (m && (m.includes("pareto/packages/core") || m.includes("@paretojs"))) {
              return true;
            }
            return false;
          },
          name: "paretojs",
          chunks: "initial",
          reuseExistingChunk: true,
        },
      },
    },
  },
};

exports.generateCssLoaders = generateCssLoaders;

exports.spiltChunks = spiltChunks;
