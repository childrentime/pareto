const { CONFIG_PATH } = require("../constant");
const fs = require("fs-extra");

/**
 * @type {import("../config").ParetoConfig}
 */
let pageConfig = {
  pageDir: 'app',
  configureRspack(config) {
    return config;
  }
};

if (fs.existsSync(CONFIG_PATH)) {
  const customConfig = require(CONFIG_PATH);
  pageConfig = { ...pageConfig, ...customConfig };
}

module.exports = pageConfig;