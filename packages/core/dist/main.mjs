import {
  __objRest,
  __spreadValues,
  init_esm_shims
} from "./chunk-TSWIMCPP.mjs";

// main.ts
init_esm_shims();

// useStyles/index.ts
init_esm_shims();
import { createContext, useContext, useInsertionEffect } from "react";
var StyleContext = createContext({
  insertCss: null
});
var isBrowser = /* @__PURE__ */ (() => void 0)();
var __DEV__ = !process.env.NODE_ENV || process.env.NODE_ENV === "development";
function useStyles(...styles) {
  const { insertCss } = useContext(StyleContext);
  if (!insertCss)
    throw new Error(
      'Please provide "insertCss" function by StyleContext.Provider'
    );
  const runEffect = () => {
    const removeCss = insertCss(styles);
    return () => {
      removeCss && setTimeout(removeCss, 0);
    };
  };
  if (isBrowser) {
    useInsertionEffect(runEffect, []);
  } else {
    runEffect();
  }
}

// stream-helpers/index.ts
init_esm_shims();

// stream-helpers/server.promise.ts
init_esm_shims();
var promiseMap = /* @__PURE__ */ new Map();

// stream-helpers/client.promise.ts
init_esm_shims();

// stream-helpers/constant.ts
init_esm_shims();
var STREAMING_SERIALIZATION_EVENT = "streaming_serialization_event";

// stream-helpers/client.promise.ts
var promiseMap2 = /* @__PURE__ */ new Map();
var mockClientPromise = (key) => {
  promiseMap2.set(key, new Promise(() => {
  }));
};
if (typeof window !== "undefined") {
  document.addEventListener(STREAMING_SERIALIZATION_EVENT, (event) => {
    const { detail: data } = event;
    const [key, value] = JSON.parse(data);
    promiseMap2.set(key, Promise.resolve(value));
  });
}

// stream-helpers/scripts.tsx
init_esm_shims();
import { Suspense, use } from "react";
import { Fragment, jsx } from "react/jsx-runtime";
function Scripts() {
  ;
  const promises = [...promiseMap.values()];
  const keys = [...promiseMap.keys()];
  return /* @__PURE__ */ jsx(Fragment, { children: promises.map((promise, index) => /* @__PURE__ */ jsx(Suspense, { fallback: null, children: /* @__PURE__ */ jsx(Script, { promise, path: keys[index] }) }, index)) });
}
function Script(props) {
  const { promise, path } = props;
  const data = use(promise);
  const jsonData = JSON.stringify([path, data]);
  return /* @__PURE__ */ jsx(
    "script",
    {
      suppressHydrationWarning: true,
      dangerouslySetInnerHTML: {
        __html: `
              if (!window.__STREAM_DATA__) {
                window.__STREAM_DATA__ = {};
              }
              window.__STREAM_DATA__["${path}"] = ${jsonData};
              const event = new CustomEvent('${STREAMING_SERIALIZATION_EVENT}', {
                detail: '${jsonData}'
              });document.dispatchEvent(event);
            `
      }
    }
  );
}

// stream-helpers/index.ts
var promiseMap3 = typeof window !== "undefined" ? promiseMap2 : promiseMap;

// types.ts
init_esm_shims();

// image/index.tsx
init_esm_shims();
import ReactDom from "react-dom";
import { jsx as jsx2 } from "react/jsx-runtime";
var Image = (props) => {
  const _a = props, { preload } = _a, rest = __objRest(_a, ["preload"]);
  if (!rest.src) {
    throw new Error("Image component must have a src prop");
  }
  preload && ReactDom.preload(rest.src, { as: "image" });
  return /* @__PURE__ */ jsx2("img", __spreadValues({}, rest));
};
var BackgroundImage = (props) => {
  const _a = props, { preload, src } = _a, rest = __objRest(_a, ["preload", "src"]);
  if (!src) {
    throw new Error("BackgroundImage component must have a src prop");
  }
  preload && ReactDom.preload(src, { as: "image" });
  return /* @__PURE__ */ jsx2(
    "div",
    __spreadValues({
      style: {
        backgroundImage: `url(${src})`
      }
    }, rest)
  );
};

// head/index.tsx
init_esm_shims();
import { Helmet, HelmetProvider } from "react-helmet-async";
export {
  BackgroundImage,
  Helmet,
  HelmetProvider,
  Image,
  Scripts,
  StyleContext,
  mockClientPromise,
  promiseMap3 as promiseMap,
  useStyles
};
