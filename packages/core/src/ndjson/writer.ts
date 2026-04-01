import type { Response } from 'express'

export interface NdjsonWriter {
  writeInitial(data: Record<string, unknown>): void
  writeChunk(chunk: { key: string; value?: unknown; error?: string }): void
  end(): void
}

/**
 * Prepare an Express response for NDJSON streaming and return a writer.
 *
 * Sets `Content-Type: application/x-ndjson` and disables proxy buffering
 * so each line is flushed immediately.
 */
export function createNdjsonWriter(res: Response): NdjsonWriter {
  res.setHeader('Content-Type', 'application/x-ndjson')
  res.setHeader('X-Accel-Buffering', 'no')

  return {
    writeInitial(data) {
      res.write(JSON.stringify(data) + '\n')
    },
    writeChunk(chunk) {
      res.write(JSON.stringify(chunk) + '\n')
    },
    end() {
      res.end()
    },
  }
}
