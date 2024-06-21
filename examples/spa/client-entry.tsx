import { StrictMode } from "react";
import { hydrateRoot, createRoot } from "react-dom/client";
import { ParetoPage } from "@paretojs/core";
import { PageContext } from "@paretojs/core/client";

const url = new URL(window.location.href);
const __csr = !!url.searchParams.get("__csr");

const startApp = async (Page: ParetoPage) => {
  const root = document.getElementById("main") as HTMLElement;
  await Page.setUpClient?.();
  const __INITIAL_DATA__ =  window.__INITIAL_DATA__ as Record<string,any>;

  if (__csr) {
    createRoot(root).render(
      <StrictMode>
        <PageContext>
          <Page initialData={__INITIAL_DATA__} />
        </PageContext>
      </StrictMode>
    );
    return;
  }

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
