const fs = require("fs-extra");
const path = require("path");

const cwd = process.cwd();
const PAGE_DIR = path.resolve(cwd, "app");
const TEMP = path.resolve(cwd, "./.mpa-ssr");
const entryPath = path.resolve(TEMP, "./server.ts");
const CLIENT_DIR = path.resolve(TEMP, "client");
const CLIENT_WRAPPER = path.resolve(cwd, "./client-entry.tsx");

/**
 * @type {record<string,string>}
 */
const pageEntries = fs.readdirSync(PAGE_DIR).reduce((entry, filename) => {
  const pageEntry = path.resolve(PAGE_DIR, filename, "index.tsx");
  entry[filename] = pageEntry;
  return entry;
}, {});

const getServerEntry = () => {
  const getPagesStr = () => {
    const importStr =
      Object.entries(pageEntries).reduce((result, [pageName, modulePath]) => {
        return result + `import ${pageName} from '${modulePath}';\n`;
      }, "") + "\n";

    const pageNames = Object.keys(pageEntries);
    const exportStr = `const pages = { ${pageNames.join(", ")} };\n\n`;

    return { importStr, exportStr };
  };

  const getRuntimeStr = () => {
    const assetsStr = `const assets = __non_webpack_require__('../webpack-assets.json');\n\n`;
    return {
      importStr: `const { setConfig } = require('${path.resolve(
        __dirname,
        "./runtime.config.ts"
      )}');\n\n`,
      runStr: assetsStr + "setConfig({ pages, assets });\n",
    };
  };

  const pageStr = getPagesStr();
  const runtimeStr = getRuntimeStr();

  const entryStr =
    pageStr.importStr +
    runtimeStr.importStr +
    pageStr.exportStr +
    runtimeStr.runStr;

  fs.mkdirSync(TEMP, { recursive: true });

  fs.writeFileSync(entryPath, entryStr);

  return entryPath;
};

const getClientEntries = () => {
  fs.removeSync(CLIENT_DIR);
  fs.mkdirSync(CLIENT_DIR, { recursive: true });
  return Object.entries(pageEntries).reduce(
    (clientEntries, [pageName, modulePath]) => {
      const ext = modulePath.slice(
        modulePath.lastIndexOf("."),
        modulePath.length
      );
      const pageEntry = path.resolve(CLIENT_DIR, pageName + ext);
      const entryStr =
        `import page from '${modulePath}';\nimport { startApp } from '${CLIENT_WRAPPER}';\n` +
        `startApp(page)`;

      fs.writeFileSync(pageEntry, entryStr);
      clientEntries[pageName] = [path.resolve(CLIENT_DIR, `${pageName}${ext}`)];

      return clientEntries;
    },
    {}
  );
};

module.exports = {
  getServerEntry,
  getClientEntries,
  pageEntries,
};
