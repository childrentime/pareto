import {
  Scripts,
  init_esm_shims,
  mockClientPromise,
  promiseMap
} from "./chunk-ATHF7DWE.mjs";

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

// types.ts
init_esm_shims();

// image/index.tsx
init_esm_shims();
import ReactDom from "react-dom";
import { jsx } from "react/jsx-runtime";
var Image = (props) => {
  const { preload, ...rest } = props;
  if (!rest.src) {
    throw new Error("Image component must have a src prop");
  }
  preload && ReactDom.preload(rest.src, { as: "image" });
  return /* @__PURE__ */ jsx("img", { ...rest });
};
var BackgroundImage = (props) => {
  const { preload, src, ...rest } = props;
  if (!src) {
    throw new Error("BackgroundImage component must have a src prop");
  }
  preload && ReactDom.preload(src, { as: "image" });
  return /* @__PURE__ */ jsx(
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
  promiseMap,
  useStyles
};
