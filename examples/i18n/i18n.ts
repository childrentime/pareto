import { i18n, Messages } from "@lingui/core";
import { messages as en } from "./app/home/locales/en/messages";
import { messages as zh } from "./app/home/locales/zh/messages";

export async function loadCatalog(page: string, locale: string) {
  // TODO: rspack 动态引入会无限编译，等待排查
  // const messages = await import(`./app/${page}/locales/${locale}/messages`);
  const messages = locale === "en" ? en : zh;

  return messages;
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
