import { execSync } from "node:child_process";
import path, { dirname } from "node:path";
import consola from "consola";
import { version } from "../package.json";
import { fileURLToPath } from "node:url";

execSync("npm run build", { stdio: "inherit" });
execSync("npm run templates", {stdio: "inherit"});

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let command = "npm publish --access public";

if (version.includes("beta")) {
  command += " --tag beta";
}

execSync(command, {
  stdio: "inherit",
  cwd: path.resolve(__dirname, "../"),
});

consola.success("Published create-pareto package.");
