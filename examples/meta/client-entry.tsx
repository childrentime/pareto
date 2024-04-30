import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HelmetProvider, ParetoPage } from "@pareto/core";

const startApp = (Page: ParetoPage) => {
  const root = document.getElementById("main") as HTMLElement;
  const __INITIAL_DATA__ = window.__INITIAL_DATA__;
  Page.setUpClientPromise?.();

  hydrateRoot(
    root,
    <StrictMode>
      <HelmetProvider>
        <Page initialData={__INITIAL_DATA__} />
      </HelmetProvider>
    </StrictMode>
  );
};
export { startApp };
