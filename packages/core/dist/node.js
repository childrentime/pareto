"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }





var _chunk33AE64NBjs = require('./chunk-33AE64NB.js');

// constant.js
var require_constant = _chunk33AE64NBjs.__commonJS.call(void 0, {
  "constant.js"(exports, module) {
    "use strict";
    _chunk33AE64NBjs.init_cjs_shims.call(void 0, );
    var path = _chunk33AE64NBjs.__require.call(void 0, "path");
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
var require_page_config = _chunk33AE64NBjs.__commonJS.call(void 0, {
  "configs/page.config.js"(exports, module) {
    "use strict";
    _chunk33AE64NBjs.init_cjs_shims.call(void 0, );
    var { CONFIG_PATH } = require_constant();
    var fs = _chunk33AE64NBjs.__require.call(void 0, "fs-extra");
    var pageConfig = {
      pageDir: "app",
      configureRspack(config2) {
        return config2;
      }
    };
    if (fs.existsSync(CONFIG_PATH)) {
      const customConfig = _chunk33AE64NBjs.__require.call(void 0, CONFIG_PATH);
      pageConfig = { ...pageConfig, ...customConfig };
    }
    module.exports = pageConfig;
  }
});

// configs/entry.js
var require_entry = _chunk33AE64NBjs.__commonJS.call(void 0, {
  "configs/entry.js"(exports, module) {
    "use strict";
    _chunk33AE64NBjs.init_cjs_shims.call(void 0, );
    var fs = _chunk33AE64NBjs.__require.call(void 0, "fs-extra");
    var path = _chunk33AE64NBjs.__require.call(void 0, "path");
    var pageConfig = require_page_config();
    var cwd = process.cwd();
    var PAGE_DIR = path.resolve(cwd, pageConfig.pageDir);
    var {
      ENTRY,
      SERVER_ENTRY_PATH,
      CLIENT_ENTRY_PATH,
      CLIENT_WRAPPER
    } = require_constant();
    var pageEntries3 = fs.readdirSync(PAGE_DIR).reduce((entry, filename) => {
      const pageEntry = path.resolve(PAGE_DIR, filename, "index.tsx");
      entry[filename] = pageEntry;
      return entry;
    }, {});
    var getServerEntry = () => {
      const getPagesStr = () => {
        const importStr = Object.entries(pageEntries3).reduce((result, [pageName, modulePath]) => {
          return result + `import ${pageName} from '${modulePath}';
`;
        }, "") + "\n";
        const pageNames = Object.keys(pageEntries3);
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
      return Object.entries(pageEntries3).reduce(
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
      pageEntries: pageEntries3
    };
  }
});

// node.ts
_chunk33AE64NBjs.init_cjs_shims.call(void 0, );
var import_entry2 = _chunk33AE64NBjs.__toESM.call(void 0, require_entry());

// configs/runtime.config.ts
_chunk33AE64NBjs.init_cjs_shims.call(void 0, );
var config = { pages: {}, assets: {} };
var getRuntimeConfig = () => config;
var setRuntimeConfig = (value) => {
  config = value;
};

// render/server.tsx
_chunk33AE64NBjs.init_cjs_shims.call(void 0, );
var import_entry = _chunk33AE64NBjs.__toESM.call(void 0, require_entry());
var _server = require('react-dom/server');
var _superjson = require('superjson'); var _superjson2 = _interopRequireDefault(_superjson);
var _jsxruntime = require('react/jsx-runtime');
var PADDING_EL = '<div style="height: 0">' + "\u200B".repeat(300) + "</div>";
var HEAD_CLOSE_HTML = `</head><body>${PADDING_EL}<div id="main">`;
var paretoRequestHandler = (props = {}) => async (req, res) => {
  const __csr = req.query.__csr;
  const path = req.path.slice(1);
  if (!import_entry.pageEntries[path]) {
    return;
  }
  const { pages, assets } = getRuntimeConfig();
  const asset = assets[path];
  const { js, css } = asset;
  const jsArr = typeof js === "string" ? [js] : [...js || []];
  const cssArr = typeof css === "string" ? [css] : [...css || []];
  const preloadJS = jsArr.map((js2) => {
    return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "link", { rel: "preload", href: js2, as: "script" }, js2);
  });
  const loadedCSS = cssArr.map((css2) => {
    return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "link", { rel: "stylesheet", href: css2, type: "text/css" }, css2);
  });
  const loadedJs = jsArr.map((js2) => {
    return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "script", { src: js2, async: true }, js2);
  });
  const renderHeader = (metas) => {
    return _server.renderToStaticMarkup.call(void 0, 
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _jsxruntime.Fragment, { children: [
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "meta", { charSet: "utf-8" }),
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "meta", { name: "viewport", content: "width=device-width, initial-scale=1" }),
        _optionalChain([metas, 'optionalAccess', _ => _.map, 'call', _2 => _2((meta) => meta)]),
        loadedCSS.map((css2) => css2),
        preloadJS.map((js2) => js2)
      ] })
    );
  };
  res.set({
    "X-Accel-Buffering": "no",
    "Content-Type": "text/html; charset=UTF-8"
  });
  res.write(`<!DOCTYPE html><html lang="zh-Hans"><head>${renderHeader()}`);
  res.flushHeaders();
  const Page = __csr ? () => null : pages[path];
  const initialData = !__csr ? await _optionalChain([Page, 'access', _3 => _3.getServerSideProps, 'optionalCall', _4 => _4(req, res)]) : {};
  props.pageWrapper = _optionalChain([props, 'optionalAccess', _5 => _5.pageWrapper]) || ((Page2) => {
    return {
      page: Page2,
      criticalCssMap: /* @__PURE__ */ new Map(),
      helmetContext: {}
    };
  });
  const {
    page: WrapperPage,
    helmetContext = {},
    criticalCssMap = /* @__PURE__ */ new Map()
    // @ts-ignore 
  } = props.pageWrapper(Page, initialData);
  const { pipe, abort } = _server.renderToPipeableStream.call(void 0, 
    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _jsxruntime.Fragment, { children: [
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, WrapperPage, { initialData: initialData || {} }),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
        "script",
        {
          dangerouslySetInnerHTML: {
            __html: `window.__INITIAL_DATA__ = '${_superjson2.default.stringify(
              _optionalChain([initialData, 'optionalAccess', _6 => _6.getState, 'call', _7 => _7()]) || initialData
            )}';`
          }
        }
      ),
      loadedJs.map((Script) => Script),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunk33AE64NBjs.Scripts, {})
    ] }),
    {
      onShellReady() {
        const { helmet } = helmetContext;
        const helmetContent = helmet ? `
          ${helmet.title.toString()}
          ${helmet.priority.toString()}
          ${helmet.meta.toString()}
          ${helmet.link.toString()}
          ${helmet.script.toString()}
        ` : "";
        const styles = [...criticalCssMap.keys()].map((key) => {
          return `<style id="${key}">${criticalCssMap.get(key)}</style>`;
        }).join("\n");
        res.write(`${helmetContent}${styles}${HEAD_CLOSE_HTML}`);
        pipe(res);
      }
    }
  );
  setTimeout(() => {
    abort();
  }, _optionalChain([props, 'optionalAccess', _8 => _8.delay]) || 1e4);
};
var export_pageEntries = import_entry2.pageEntries;





exports.getRuntimeConfig = getRuntimeConfig; exports.pageEntries = export_pageEntries; exports.paretoRequestHandler = paretoRequestHandler; exports.setRuntimeConfig = setRuntimeConfig;
