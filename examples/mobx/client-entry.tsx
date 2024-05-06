import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { ParetoPage } from "@pareto/core";
import { Provider } from "mobx-react";
import superjson from 'superjson'

const startApp = (Page: ParetoPage) => {
  const root = document.getElementById("main") as HTMLElement;
  const __INITIAL_DATA__ =  superjson.parse(window.__INITIAL_DATA__) as Record<string, any>;
  const store = Page.setUpClient?.(__INITIAL_DATA__);

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
