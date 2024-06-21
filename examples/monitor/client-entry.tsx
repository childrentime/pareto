import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { ParetoPage } from "@paretojs/core";
import { PageContext } from "@paretojs/core/client";
import '@paretojs/monitor/main.css'

const startApp = async (Page: ParetoPage) => {
  const root = document.getElementById("main") as HTMLElement;
  const __INITIAL_DATA__ =  window.__INITIAL_DATA__ as Record<string,any>;
  await Page.setUpClient?.();

  hydrateRoot(
    root,
    <StrictMode>
      <PageContext>
        <Page initialData={__INITIAL_DATA__} />
      </PageContext>
    </StrictMode>
  );
};
export { startApp };
