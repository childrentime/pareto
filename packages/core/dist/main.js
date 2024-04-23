"use strict";Object.defineProperty(exports, "__esModule", {value: true});// useStyles/index.ts
var _react = require('react');
var StyleContext = _react.createContext.call(void 0, {
  insertCss: null
});
var isBrowser = /* @__PURE__ */ (() => void 0)();
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



exports.StyleContext = StyleContext; exports.useStyles = useStyles;
