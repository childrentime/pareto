declare global {
  interface Window {
    __STREAM_DATA__: Record<string, any>
    __INITIAL_DATA__: any
  }
}

export {}
