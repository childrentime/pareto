const path = require("path");
const cwd = process.cwd();

const APP_PATH = path.resolve(cwd, ".pareto/server");
const ENTRY = path.resolve(cwd, ".pareto", "entry");
const SERVER_ENTRY_PATH = path.resolve(ENTRY, "./server.ts");
const CLIENT_ENTRY_PATH = path.resolve(ENTRY, "client");
const CLIENT_WRAPPER = path.resolve(cwd, "./client-entry.tsx");
const CLIENT_OUTPUT_PATH = path.resolve(cwd, ".pareto/client");
const ASSETS_PATH = path.resolve(CLIENT_OUTPUT_PATH, "webpack-assets.json");
const CONFIG_PATHS = [
  path.resolve(cwd, "pareto.config.js"),
  path.resolve(cwd, "pareto.config.mjs"),
  path.resolve(cwd, "pareto.config.ts"),
  path.resolve(cwd, "pareto.config.mts"),
]

module.exports = {
  APP_PATH,
  ENTRY,
  SERVER_ENTRY_PATH,
  CLIENT_ENTRY_PATH,
  CLIENT_WRAPPER,
  CLIENT_OUTPUT_PATH,
  ASSETS_PATH,
  CONFIG_PATHS
};
