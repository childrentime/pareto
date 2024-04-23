// useStyles/index.ts
import { createContext, useContext, useInsertionEffect } from "react";
var StyleContext = createContext({
  insertCss: null
});
var isBrowser = /* @__PURE__ */ (() => void 0)();
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
export {
  StyleContext,
  useStyles
};
