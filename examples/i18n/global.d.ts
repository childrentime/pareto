/// <reference types="react/canary" />
/// <reference types="@paretojs/core/env" />

declare global {
  interface Window {
      __INITIAL_DATA__: any;
      initialI18nStore: any;
      initialLanguage: any;
  }
}

export {};