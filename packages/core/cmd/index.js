const cac = require("cac");
const { version } = require("../package.json");
const cli = cac("pareto").version(version).help();
const path = require("path");
const cwd = process.cwd();
const dist = path.resolve(cwd, ".pareto");
const fs = require("fs-extra");

cli.command("dev", "start dev server").action(async () => {
  if (fs.existsSync(dist)) {
    fs.removeSync(dist);
  }
  fs.ensureDirSync(dist);
  const { dev } = require("./dev");
  dev();
});

cli.command("build", "build dev server").action(async () => {
  if (fs.existsSync(dist)) {
    fs.removeSync(dist);
  }
  fs.ensureDirSync(dist);
  const { build } = require("./build");
  build();
});

cli.parse();
