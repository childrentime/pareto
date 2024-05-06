import {
  Scripts,
  __commonJS,
  __require,
  __toESM,
  init_esm_shims
} from "./chunk-ATHF7DWE.mjs";

// constant.js
var require_constant = __commonJS({
  "constant.js"(exports, module) {
    "use strict";
    init_esm_shims();
    var path = __require("path");
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
var require_page_config = __commonJS({
  "configs/page.config.js"(exports, module) {
    "use strict";
    init_esm_shims();
    var { CONFIG_PATH } = require_constant();
    var fs = __require("fs-extra");
    var pageConfig = {
      pageDir: "app",
      configureRspack(config2) {
        return config2;
      }
    };
    if (fs.existsSync(CONFIG_PATH)) {
      const customConfig = __require(CONFIG_PATH);
      pageConfig = { ...pageConfig, ...customConfig };
    }
    module.exports = pageConfig;
  }
});

// configs/entry.js
var require_entry = __commonJS({
  "configs/entry.js"(exports, module) {
    "use strict";
    init_esm_shims();
    var fs = __require("fs-extra");
    var path = __require("path");
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
init_esm_shims();
var import_entry2 = __toESM(require_entry());

// configs/runtime.config.ts
init_esm_shims();
var config = { pages: {}, assets: {} };
var getRuntimeConfig = () => config;
var setRuntimeConfig = (value) => {
  config = value;
};

// render/server.tsx
init_esm_shims();
var import_entry = __toESM(require_entry());
import { renderToPipeableStream, renderToStaticMarkup } from "react-dom/server";
import superjson from "superjson";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
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
    return /* @__PURE__ */ jsx("link", { rel: "preload", href: js2, as: "script" }, js2);
  });
  const loadedCSS = cssArr.map((css2) => {
    return /* @__PURE__ */ jsx("link", { rel: "stylesheet", href: css2, type: "text/css" }, css2);
  });
  const loadedJs = jsArr.map((js2) => {
    return /* @__PURE__ */ jsx("script", { src: js2, async: true }, js2);
  });
  const renderHeader = (metas) => {
    return renderToStaticMarkup(
      /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("meta", { charSet: "utf-8" }),
        /* @__PURE__ */ jsx("meta", { name: "viewport", content: "width=device-width, initial-scale=1" }),
        metas?.map((meta) => meta),
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
  const initialData = !__csr ? await Page.getServerSideProps?.(req, res) : {};
  props.pageWrapper = props?.pageWrapper || ((Page2) => {
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
  const { pipe, abort } = renderToPipeableStream(
    /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(WrapperPage, { initialData: initialData || {} }),
      /* @__PURE__ */ jsx(
        "script",
        {
          dangerouslySetInnerHTML: {
            __html: `window.__INITIAL_DATA__ = '${superjson.stringify(
              initialData?.getState() || initialData
            )}';`
          }
        }
      ),
      loadedJs.map((Script) => Script),
      /* @__PURE__ */ jsx(Scripts, {})
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
  }, props?.delay || 1e4);
};
var export_pageEntries = import_entry2.pageEntries;
export {
  getRuntimeConfig,
  export_pageEntries as pageEntries,
  paretoRequestHandler,
  setRuntimeConfig
};
