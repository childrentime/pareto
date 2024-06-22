const cac = require("cac");
const { version } = require("../package.json");
const cli = cac("pareto").version(version).help();
const fs = require("fs-extra");
const { DIST_PATH } = require("../constant");

cli.command("dev", "start dev server").action(async () => {
  if (fs.existsSync(DIST_PATH)) {
    fs.removeSync(DIST_PATH);
  }
  fs.ensureDirSync(DIST_PATH);
  const { dev } = require("./dev");
  dev();
});

cli.command("build", "build dev server").action(async () => {
  if (fs.existsSync(DIST_PATH)) {
    fs.removeSync(DIST_PATH);
  }
  fs.ensureDirSync(DIST_PATH);
  const { build } = require("./build");
  build();
});

cli.parse();
