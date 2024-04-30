import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { ParetoPage } from "@pareto/core";
import { Provider } from "mobx-react";

const startApp = (Page: ParetoPage) => {
  const root = document.getElementById("main") as HTMLElement;
  const __INITIAL_DATA__ = window.__INITIAL_DATA__;
  Page.setUpClientPromise?.();

  const store = new Page.Store();
  store.hydrate(__INITIAL_DATA__)

  hydrateRoot(
    root,
    <StrictMode>
      <Provider store={store}>
        <Page initialData={__INITIAL_DATA__} />
      </Provider>
    </StrictMode>
  );
};
export { startApp };
