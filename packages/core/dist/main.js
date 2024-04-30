"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }



var _chunkLRFJSNK4js = require('./chunk-LRFJSNK4.js');

// main.ts
_chunkLRFJSNK4js.init_cjs_shims.call(void 0, );

// useStyles/index.ts
_chunkLRFJSNK4js.init_cjs_shims.call(void 0, );
var _react = require('react');
var StyleContext = _react.createContext.call(void 0, {
  insertCss: null
});
var isBrowser = /* @__PURE__ */ (() => void 0)();
var __DEV__ = !process.env.NODE_ENV || process.env.NODE_ENV === "development";
function useStyles(...styles) {
  const { insertCss } = _react.useContext.call(void 0, StyleContext);
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
    _react.useInsertionEffect.call(void 0, runEffect, []);
  } else {
    runEffect();
  }
}

// stream-helpers/index.ts
_chunkLRFJSNK4js.init_cjs_shims.call(void 0, );

// stream-helpers/server.promise.ts
_chunkLRFJSNK4js.init_cjs_shims.call(void 0, );
var promiseMap = /* @__PURE__ */ new Map();

// stream-helpers/client.promise.ts
_chunkLRFJSNK4js.init_cjs_shims.call(void 0, );

// stream-helpers/constant.ts
_chunkLRFJSNK4js.init_cjs_shims.call(void 0, );
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
_chunkLRFJSNK4js.init_cjs_shims.call(void 0, );

var _jsxruntime = require('react/jsx-runtime');
function Scripts() {
  ;
  const promises = [...promiseMap.values()];
  const keys = [...promiseMap.keys()];
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _jsxruntime.Fragment, { children: promises.map((promise, index) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _react.Suspense, { fallback: null, children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, Script, { promise, path: keys[index] }) }, index)) });
}
function Script(props) {
  const { promise, path } = props;
  const data = _react.use.call(void 0, promise);
  const jsonData = JSON.stringify([path, data]);
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
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
_chunkLRFJSNK4js.init_cjs_shims.call(void 0, );

// image/index.tsx
_chunkLRFJSNK4js.init_cjs_shims.call(void 0, );
var _reactdom = require('react-dom'); var _reactdom2 = _interopRequireDefault(_reactdom);

var Image = (props) => {
  const _a = props, { preload } = _a, rest = _chunkLRFJSNK4js.__objRest.call(void 0, _a, ["preload"]);
  if (!rest.src) {
    throw new Error("Image component must have a src prop");
  }
  preload && _reactdom2.default.preload(rest.src, { as: "image" });
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "img", _chunkLRFJSNK4js.__spreadValues.call(void 0, {}, rest));
};
var BackgroundImage = (props) => {
  const _a = props, { preload, src } = _a, rest = _chunkLRFJSNK4js.__objRest.call(void 0, _a, ["preload", "src"]);
  if (!src) {
    throw new Error("BackgroundImage component must have a src prop");
  }
  preload && _reactdom2.default.preload(src, { as: "image" });
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    "div",
    _chunkLRFJSNK4js.__spreadValues.call(void 0, {
      style: {
        backgroundImage: `url(${src})`
      }
    }, rest)
  );
};

// head/index.tsx
_chunkLRFJSNK4js.init_cjs_shims.call(void 0, );
var _reacthelmetasync = require('react-helmet-async');










exports.BackgroundImage = BackgroundImage; exports.Helmet = _reacthelmetasync.Helmet; exports.HelmetProvider = _reacthelmetasync.HelmetProvider; exports.Image = Image; exports.Scripts = Scripts; exports.StyleContext = StyleContext; exports.mockClientPromise = mockClientPromise; exports.promiseMap = promiseMap3; exports.useStyles = useStyles;
