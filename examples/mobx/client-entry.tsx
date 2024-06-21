import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { ParetoPage } from "@paretojs/core";
import { Provider } from "mobx-react";
import { PageContext } from "@paretojs/core/client";

const startApp = async (Page: ParetoPage) => {
  const root = document.getElementById("main") as HTMLElement;
  const __INITIAL_DATA__ =  window.__INITIAL_DATA__ as Record<string,any>;
  const store = await Page.setUpClient?.(__INITIAL_DATA__);

  hydrateRoot(
    root,
    <StrictMode>
      <PageContext>
        <Provider store={store}>
          <Page initialData={__INITIAL_DATA__} />
        </Provider>
      </PageContext>
    </StrictMode>
  );
};
export { startApp };
