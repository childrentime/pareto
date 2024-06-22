const fs = require("fs-extra");
const path = require("path");
const cwd = process.cwd();
const jiti = require("jiti")(__filename, {
  debug: process.env.debug,
  cache: false
});
const CONFIG_PATHS = [
  path.resolve(cwd, "pareto.config.js"),
  path.resolve(cwd, "pareto.config.mjs"),
  path.resolve(cwd, "pareto.config.ts"),
  path.resolve(cwd, "pareto.config.mts"),
];

/**
 * @type {import("../config").ParetoConfig}
 */
let pageConfig = {
  pageDir: "app",
  configureRspack(config) {
    return config;
  },
  enableSpa: false,
  enableMonitor: false,
  distDir: '.pareto',
};

for (const CONFIG_PATH of CONFIG_PATHS) {
  if (fs.existsSync(CONFIG_PATH)) {
    const customConfig = jiti(CONFIG_PATH);
    const unpackConfig = customConfig.default || customConfig;
    pageConfig = { ...pageConfig, ...unpackConfig };
    break;
  }
}
module.exports = pageConfig;
