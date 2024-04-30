import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { ParetoPage } from "@pareto/core";
import { ZustandProvider } from "./lib/zustand";

const startApp = async (Page: ParetoPage) => {
  const root = document.getElementById("main") as HTMLElement;
  const __INITIAL_DATA__ = window.__INITIAL_DATA__;
  Page.setUpClientPromise?.();

  const store = await Page.createPageStore(__INITIAL_DATA__);

  hydrateRoot(
    root,
    <StrictMode>
      <ZustandProvider value={store}>
        <Page initialData={__INITIAL_DATA__} />
      </ZustandProvider>
    </StrictMode>
  );
};
export { startApp };
