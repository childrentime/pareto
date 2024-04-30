"use strict";Object.defineProperty(exports, "__esModule", {value: true});





var _chunkLRFJSNK4js = require('./chunk-LRFJSNK4.js');

// constant.js
var require_constant = _chunkLRFJSNK4js.__commonJS.call(void 0, {
  "constant.js"(exports, module) {
    "use strict";
    _chunkLRFJSNK4js.init_cjs_shims.call(void 0, );
    var path = _chunkLRFJSNK4js.__require.call(void 0, "path");
    var cwd = process.cwd();
    var APP_PATH = path.resolve(cwd, ".pareto/server");
    var ENTRY = path.resolve(cwd, ".pareto", "entry");
    var SERVER_ENTRY_PATH = path.resolve(ENTRY, "./server.ts");
    var CLIENT_ENTRY_PATH = path.resolve(ENTRY, "client");
    var CLIENT_WRAPPER = path.resolve(cwd, "./client-entry.tsx");
    var CLIENT_OUTPUT_PATH = path.resolve(cwd, ".pareto/client");
    var ASSETS_PATH = path.resolve(CLIENT_OUTPUT_PATH, "webpack-assets.json");
    var CONFIG_PATH = path.resolve(cwd, "pareto.config.js");
    module.exports = {
      APP_PATH,
      ENTRY,
      SERVER_ENTRY_PATH,
      CLIENT_ENTRY_PATH,
      CLIENT_WRAPPER,
      CLIENT_OUTPUT_PATH,
      ASSETS_PATH,
      CONFIG_PATH
    };
  }
});

// configs/page.config.js
var require_page_config = _chunkLRFJSNK4js.__commonJS.call(void 0, {
  "configs/page.config.js"(exports, module) {
    "use strict";
    _chunkLRFJSNK4js.init_cjs_shims.call(void 0, );
    var { CONFIG_PATH } = require_constant();
    var fs = _chunkLRFJSNK4js.__require.call(void 0, "fs-extra");
    var pageConfig = {
      pageDir: "app",
      configureRspack(config2) {
        return config2;
      }
    };
    if (fs.existsSync(CONFIG_PATH)) {
      const customConfig = _chunkLRFJSNK4js.__require.call(void 0, CONFIG_PATH);
      pageConfig = _chunkLRFJSNK4js.__spreadValues.call(void 0, _chunkLRFJSNK4js.__spreadValues.call(void 0, {}, pageConfig), customConfig);
    }
    module.exports = pageConfig;
  }
});

// configs/entry.js
var require_entry = _chunkLRFJSNK4js.__commonJS.call(void 0, {
  "configs/entry.js"(exports, module) {
    "use strict";
    _chunkLRFJSNK4js.init_cjs_shims.call(void 0, );
    var fs = _chunkLRFJSNK4js.__require.call(void 0, "fs-extra");
    var path = _chunkLRFJSNK4js.__require.call(void 0, "path");
    var pageConfig = require_page_config();
    var cwd = process.cwd();
    var PAGE_DIR = path.resolve(cwd, pageConfig.pageDir);
    var {
      ENTRY,
      SERVER_ENTRY_PATH,
      CLIENT_ENTRY_PATH,
      CLIENT_WRAPPER
    } = require_constant();
    var pageEntries2 = fs.readdirSync(PAGE_DIR).reduce((entry, filename) => {
      const pageEntry = path.resolve(PAGE_DIR, filename, "index.tsx");
      entry[filename] = pageEntry;
      return entry;
    }, {});
    var getServerEntry = () => {
      const getPagesStr = () => {
        const importStr = Object.entries(pageEntries2).reduce((result, [pageName, modulePath]) => {
          return result + `import ${pageName} from '${modulePath}';
`;
        }, "") + "\n";
        const pageNames = Object.keys(pageEntries2);
        const exportStr = `const pages = { ${pageNames.join(", ")} };

`;
        return { importStr, exportStr };
      };
      const getRuntimeStr = () => {
        const assetsStr = `const assets = __non_webpack_require__('../client/webpack-assets.json');

`;
        return {
          importStr: `import { setRuntimeConfig } from "@pareto/core/node";

`,
          runStr: assetsStr + "setRuntimeConfig({ pages, assets });\n"
        };
      };
      const pageStr = getPagesStr();
      const runtimeStr = getRuntimeStr();
      const entryStr = pageStr.importStr + runtimeStr.importStr + pageStr.exportStr + runtimeStr.runStr;
      fs.mkdirSync(ENTRY, { recursive: true });
      fs.writeFileSync(SERVER_ENTRY_PATH, entryStr);
      return SERVER_ENTRY_PATH;
    };
    var getClientEntries = () => {
      fs.ensureDirSync(ENTRY);
      fs.ensureDirSync(CLIENT_ENTRY_PATH);
      return Object.entries(pageEntries2).reduce(
        (clientEntries, [pageName, modulePath]) => {
          const ext = modulePath.slice(
            modulePath.lastIndexOf("."),
            modulePath.length
          );
          const pageEntry = path.resolve(CLIENT_ENTRY_PATH, pageName + ext);
          const entryStr = `import page from '${modulePath}';
import { startApp } from '${CLIENT_WRAPPER}';
startApp(page)`;
          fs.writeFileSync(pageEntry, entryStr);
          clientEntries[pageName] = [
            path.resolve(CLIENT_ENTRY_PATH, `${pageName}${ext}`)
          ];
          return clientEntries;
        },
        {}
      );
    };
    module.exports = {
      getServerEntry,
      getClientEntries,
      pageEntries: pageEntries2
    };
  }
});

// node.ts
_chunkLRFJSNK4js.init_cjs_shims.call(void 0, );
var import_entry = _chunkLRFJSNK4js.__toESM.call(void 0, require_entry());

// configs/runtime.config.ts
_chunkLRFJSNK4js.init_cjs_shims.call(void 0, );
var config = { pages: {}, assets: {} };
var getRuntimeConfig = () => config;
var setRuntimeConfig = (value) => {
  config = value;
};
var export_pageEntries = import_entry.pageEntries;




exports.getRuntimeConfig = getRuntimeConfig; exports.pageEntries = export_pageEntries; exports.setRuntimeConfig = setRuntimeConfig;
