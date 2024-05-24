import { PropsWithChildren } from "react";
import { InsertCss, StyleContext } from "../useStyles";
import { HelmetProvider } from "../head";

const insertCss: InsertCss = (styles) => {
  const removeCss = styles.map((style) => style._insertCss());
  return () => removeCss.forEach((dispose) => dispose());
};

export const PageContext = (props: PropsWithChildren<{}>) => {
  // @ts-ignore react19
  return <HelmetProvider>
    {/* @ts-ignore react19 */}
    <StyleContext value={{ insertCss }}>{props.children}</StyleContext>
  </HelmetProvider>;
};
