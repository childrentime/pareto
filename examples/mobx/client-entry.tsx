import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { ParetoPage } from "@pareto/core";
import { Provider } from "mobx-react";
import superjson from "superjson";
import { PageContext } from "@pareto/core/client";

const startApp = (Page: ParetoPage) => {
  const root = document.getElementById("main") as HTMLElement;
  const __INITIAL_DATA__ = superjson.parse(window.__INITIAL_DATA__) as Record<
    string,
    any
  >;
  const store = Page.setUpClient?.(__INITIAL_DATA__);

  hydrateRoot(
    root,
    <StrictMode>
      <Provider store={store}>
        <PageContext>
          <Page initialData={__INITIAL_DATA__} />
        </PageContext>
      </Provider>
    </StrictMode>
  );
};
export { startApp };
