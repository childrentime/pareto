import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { InsertCss, ParetoPage, StyleContext } from "@pareto/core";

const insertCss: InsertCss = (styles) => {
  const removeCss = styles.map((style) => style._insertCss());
  return () => removeCss.forEach((dispose) => dispose());
};

const startApp = (Page: ParetoPage) => {
  const root = document.getElementById("main") as HTMLElement;
  const __INITIAL_DATA__ = window.__INITIAL_DATA__;
  Page.setUpClientPromise?.();

  hydrateRoot(
    root,
    <StrictMode>
      {/*   @ts-ignore react 19 */}
      <StyleContext value={{ insertCss }}>
        <Page initialData={__INITIAL_DATA__} />
      </StyleContext>
    </StrictMode>
  );
};
export { startApp };
