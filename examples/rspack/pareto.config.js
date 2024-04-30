const rspack = require('@rspack/core');
/**
 * @type {import('@pareto/core/config').ParetoConfig}
 */
const config = {
  pageDir: 'pages',
  configureRspack(config,{isServer}) {
    if (isServer) {
      config.plugins.push(
        new rspack.DefinePlugin({
          'process.env.password': JSON.stringify('password'),
        })
      );
    }
  
    return config;
  }
}

module.exports = config;