/**
 * Lightweight NDJSON reader for the browser.
 *
 * Reads a `ReadableStream<Uint8Array>` line-by-line, yielding one parsed
 * JSON value per line. Handles partial chunks and multi-line buffering.
 */
export function createNdjsonReader(body: ReadableStream<Uint8Array>) {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  return {
    async readLine(): Promise<string | null> {
      while (true) {
        const nlIndex = buffer.indexOf('\n')
        if (nlIndex !== -1) {
          const line = buffer.slice(0, nlIndex)
          buffer = buffer.slice(nlIndex + 1)
          return line
        }
        const { done, value } = await reader.read()
        if (done) {
          if (buffer.length > 0) {
            const rest = buffer
            buffer = ''
            return rest
          }
          return null
        }
        buffer += decoder.decode(value, { stream: true })
      }
    },

    cancel() {
      void reader.cancel()
    },
  }
}
