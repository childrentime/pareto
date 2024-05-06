"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }




var _chunk33AE64NBjs = require('./chunk-33AE64NB.js');

// main.ts
_chunk33AE64NBjs.init_cjs_shims.call(void 0, );

// useStyles/index.ts
_chunk33AE64NBjs.init_cjs_shims.call(void 0, );
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

// types.ts
_chunk33AE64NBjs.init_cjs_shims.call(void 0, );

// image/index.tsx
_chunk33AE64NBjs.init_cjs_shims.call(void 0, );
var _reactdom = require('react-dom'); var _reactdom2 = _interopRequireDefault(_reactdom);
var _jsxruntime = require('react/jsx-runtime');
var Image = (props) => {
  const { preload, ...rest } = props;
  if (!rest.src) {
    throw new Error("Image component must have a src prop");
  }
  preload && _reactdom2.default.preload(rest.src, { as: "image" });
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "img", { ...rest });
};
var BackgroundImage = (props) => {
  const { preload, src, ...rest } = props;
  if (!src) {
    throw new Error("BackgroundImage component must have a src prop");
  }
  preload && _reactdom2.default.preload(src, { as: "image" });
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    "div",
    {
      style: {
        backgroundImage: `url(${src})`
      },
      ...rest
    }
  );
};

// head/index.tsx
_chunk33AE64NBjs.init_cjs_shims.call(void 0, );
var _reacthelmetasync = require('react-helmet-async');










exports.BackgroundImage = BackgroundImage; exports.Helmet = _reacthelmetasync.Helmet; exports.HelmetProvider = _reacthelmetasync.HelmetProvider; exports.Image = Image; exports.Scripts = _chunk33AE64NBjs.Scripts; exports.StyleContext = StyleContext; exports.mockClientPromise = _chunk33AE64NBjs.mockClientPromise; exports.promiseMap = _chunk33AE64NBjs.promiseMap; exports.useStyles = useStyles;
