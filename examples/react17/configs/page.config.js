const { CONFIG_PATHS } = require("../constant");
const fs = require("fs-extra");
const jiti = require("jiti")(__filename, {
  debug: process.env.debug,
  cache: false
});

/**
 * @type {import("../config").ParetoConfig}
 */
let pageConfig = {
  pageDir: "app",
  configureRspack(config) {
    return config;
  },
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
