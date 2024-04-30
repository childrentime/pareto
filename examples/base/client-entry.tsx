import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { ParetoPage } from "@pareto/core";

const startApp = (Page: ParetoPage) => {
  const root = document.getElementById("main") as HTMLElement;
  const __INITIAL_DATA__ = window.__INITIAL_DATA__;
  Page.setUpClientPromise?.();

  hydrateRoot(
    root,
    <StrictMode>
      <Page initialData={__INITIAL_DATA__} />
    </StrictMode>
  );
};
export { startApp };
