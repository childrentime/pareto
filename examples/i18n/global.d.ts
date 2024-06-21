/// <reference types="react/canary" />
/// <reference types="@paretojs/core/env" />

declare global {
  interface Window {
      __INITIAL_DATA__: any;
      __LOCALE__: string;
      __LOCALE_MESSAGE__: any;
  }
}

export {};