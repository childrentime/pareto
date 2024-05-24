import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { ParetoPage } from "@pareto/core";
import { ZustandProvider } from "./lib/zustand";
import superjson from "superjson";
import { PageContext } from "@pareto/core/client";

const startApp = async (Page: ParetoPage) => {
  const root = document.getElementById("main") as HTMLElement;
  const __INITIAL_DATA__ = superjson.parse(window.__INITIAL_DATA__) as Record<
    string,
    any
  >;
  const store = await Page.setUpClient?.(__INITIAL_DATA__);

  hydrateRoot(
    root,
    <StrictMode>
      <ZustandProvider value={store}>
        <PageContext>
          <Page initialData={__INITIAL_DATA__} />
        </PageContext>
      </ZustandProvider>
    </StrictMode>
  );
};
export { startApp };
