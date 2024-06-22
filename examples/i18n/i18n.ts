import { i18n, Messages } from "@lingui/core";

export function loadCatalog(page: string, locale: string) {
  /* when you need to load messages in production，
   ** You can use a script after pnpm build to move the contents of the locales folder
   ** into the .pareto folder and modify the import paths here.
   */
  const data = require(`./app/${page}/locales/${locale}/messages`);
  return data.messages;
}

export function initLinguiServer(messages: Messages, locale: string) {
  if (locale !== i18n.locale) {
    i18n.loadAndActivate({ locale, messages });
  }
}

export function initLinguiClient() {
  const locale = window.__LOCALE__;
  const messages = window.__LOCALE_MESSAGE__;

  i18n.load(locale, messages);
  i18n.activate(locale);
}
