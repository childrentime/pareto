const cac = require("cac");
const { version } = require("../package.json");

const cli = cac("x").version(version).help();

cli.command("dev", "start dev server").action(async () => {
  const { dev } = require("./dev");
  dev();
});

cli.parse();
