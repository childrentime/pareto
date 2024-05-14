const cac = require("cac");
const { version } = require("../package.json");
/**
 * @type {import("cac").CAC}
 */
const cli = cac("create-pareto").version(version).help();
const cwd = process.cwd();
const fs = require('fs-extra')

cli.option("--dir [dir]", "create a dir");
cli.option("--template [template]", "template");
cli.command("").action(async (folder, options) => {
  console.log("folder", folder, options);
  let { dir, template } = folder;
  if(!dir){
    console.error("--dir [dir] is required");
  }
  template = template || "base";
  const targetDir = `${cwd}/${dir}`;
  const templateDir = `${__dirname}/../templates/${template}`;
  fs.copySync(templateDir, targetDir);

  console.log('Success!')
});

cli.parse();
