import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { ParetoPage } from "@pareto/core";
import './index.css';
import superjson from "superjson";

const startApp = async (Page: ParetoPage) => {
  const root = document.getElementById("main") as HTMLElement;
  const __INITIAL_DATA__ = superjson.parse(window.__INITIAL_DATA__) as Record<string, any>;
  await Page.setUpClient?.();

  hydrateRoot(
    root,
    <StrictMode>
      <Page initialData={__INITIAL_DATA__} />
    </StrictMode>
  );
};
export { startApp };
