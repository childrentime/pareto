import { PropsWithChildren } from "react";
import { InsertCss, StyleContext } from "../useStyles";
import { HelmetProvider } from "react-helmet-async";
import { IS_REACT_19 } from "../utils/env";

const insertCss: InsertCss = (styles) => {
  const removeCss = styles.map((style) => style._insertCss());
  return () => removeCss.forEach((dispose) => dispose());
};

export const PageContext = (props: PropsWithChildren<{}>) => {
  const  StyleProvider = IS_REACT_19 ? StyleContext : StyleContext.Provider;

  return (
    <HelmetProvider>
      {/* @ts-ignore react19 */}
      <StyleProvider value={{ insertCss }}>{props.children}</StyleProvider>
    </HelmetProvider>
  );
};

