import { StrictMode } from "react";
import { hydrateRoot, createRoot } from "react-dom/client";
import { ParetoPage } from "@pareto/core";
import superjson from "superjson";
import { PageContext } from "@pareto/core/client";

const url = new URL(window.location.href);
const __csr = !!url.searchParams.get("__csr");

const startApp = async (Page: ParetoPage) => {
  const root = document.getElementById("main") as HTMLElement;
  await Page.setUpClient?.();
  const __INITIAL_DATA__ = superjson.parse(window.__INITIAL_DATA__) as Record<
    string,
    any
  >;

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
