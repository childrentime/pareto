import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { ParetoPage } from "@paretojs/core";
import { PageContext } from "@paretojs/core/client";
import { useSSR } from "react-i18next";
import './i18n';

const startApp = async (Page: ParetoPage) => {
  const root = document.getElementById("main") as HTMLElement;
  const __INITIAL_DATA__ = window.__INITIAL_DATA__ as Record<string, any>;
  await Page.setUpClient?.();

  const I18NPage = (props: any) => {
    useSSR(window.initialI18nStore, window.initialLanguage);

    return <Page {...props} />;
  };

  hydrateRoot(
    root,
    <StrictMode>
      <PageContext>
        <I18NPage initialData={__INITIAL_DATA__} />
      </PageContext>
    </StrictMode>
  );
};
export { startApp };
