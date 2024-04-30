declare global {
  interface Window {
      __STREAM_DATA__: Record<string,any>;
  }
}

export {};