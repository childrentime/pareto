const rspack = require("@rspack/core");

const __DEV__ = !process.env.NODE_ENV || process.env.NODE_ENV === "development";

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

exports.generateCssLoaders = generateCssLoaders;
