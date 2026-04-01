import { describe, expect, it, vi } from 'vitest'
import { createNdjsonReader } from '../ndjson/reader'
import { createNdjsonWriter } from '../ndjson/writer'

// ---------------------------------------------------------------------------
// Writer
// ---------------------------------------------------------------------------

describe('createNdjsonWriter', () => {
  function mockRes() {
    const chunks: string[] = []
    const headers: Record<string, string> = {}
    return {
      setHeader: vi.fn((k: string, v: string) => {
        headers[k] = v
      }),
      write: vi.fn((data: string) => {
        chunks.push(data)
      }),
      end: vi.fn(),
      _chunks: chunks,
      _headers: headers,
    }
  }

  it('sets correct headers', () => {
    const res = mockRes()
    createNdjsonWriter(res as any)
    expect(res._headers['Content-Type']).toBe('application/x-ndjson')
    expect(res._headers['X-Accel-Buffering']).toBe('no')
  })

  it('writeInitial sends JSON + newline', () => {
    const res = mockRes()
    const writer = createNdjsonWriter(res as any)
    writer.writeInitial({
      loaderData: { a: 1 },
      params: {},
      pendingKeys: ['b'],
    })
    expect(res._chunks).toHaveLength(1)
    const parsed = JSON.parse(res._chunks[0].replace('\n', ''))
    expect(parsed.loaderData).toEqual({ a: 1 })
    expect(parsed.pendingKeys).toEqual(['b'])
    expect(res._chunks[0].endsWith('\n')).toBe(true)
  })

  it('writeChunk sends key/value as JSON + newline', () => {
    const res = mockRes()
    const writer = createNdjsonWriter(res as any)
    writer.writeChunk({ key: 'users', value: [1, 2, 3] })
    const parsed = JSON.parse(res._chunks[0].replace('\n', ''))
    expect(parsed).toEqual({ key: 'users', value: [1, 2, 3] })
  })

  it('writeChunk sends key/error for failures', () => {
    const res = mockRes()
    const writer = createNdjsonWriter(res as any)
    writer.writeChunk({ key: 'data', error: 'timeout' })
    const parsed = JSON.parse(res._chunks[0].replace('\n', ''))
    expect(parsed).toEqual({ key: 'data', error: 'timeout' })
  })

  it('end calls res.end', () => {
    const res = mockRes()
    const writer = createNdjsonWriter(res as any)
    writer.end()
    expect(res.end).toHaveBeenCalledOnce()
  })

  it('multiple writes produce multiple newline-delimited chunks', () => {
    const res = mockRes()
    const writer = createNdjsonWriter(res as any)
    writer.writeInitial({ type: 'initial' })
    writer.writeChunk({ key: 'a', value: 1 })
    writer.writeChunk({ key: 'b', value: 2 })
    writer.end()
    expect(res._chunks).toHaveLength(3)
    for (const chunk of res._chunks) {
      expect(chunk.endsWith('\n')).toBe(true)
      expect(() => JSON.parse(chunk)).not.toThrow()
    }
  })
})

// ---------------------------------------------------------------------------
// Reader
// ---------------------------------------------------------------------------

function makeStream(lines: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  const joined = lines.join('\n') + (lines.length > 0 ? '\n' : '')
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(joined))
      controller.close()
    },
  })
}

function makeChunkedStream(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk))
      }
      controller.close()
    },
  })
}

describe('createNdjsonReader', () => {
  it('reads single line', async () => {
    const stream = makeStream([JSON.stringify({ hello: 'world' })])
    const reader = createNdjsonReader(stream)

    const line = await reader.readLine()
    expect(line).toBe(JSON.stringify({ hello: 'world' }))

    const eof = await reader.readLine()
    expect(eof).toBeNull()
  })

  it('reads multiple lines', async () => {
    const data = [
      JSON.stringify({ type: 'initial', count: 1 }),
      JSON.stringify({ key: 'a', value: 42 }),
      JSON.stringify({ key: 'b', value: 'hello' }),
    ]
    const stream = makeStream(data)
    const reader = createNdjsonReader(stream)

    const results: string[] = []
    let line: string | null
    while ((line = await reader.readLine()) !== null) {
      if (line) results.push(line)
    }

    expect(results).toHaveLength(3)
    expect(JSON.parse(results[0])).toEqual({ type: 'initial', count: 1 })
    expect(JSON.parse(results[1])).toEqual({ key: 'a', value: 42 })
    expect(JSON.parse(results[2])).toEqual({ key: 'b', value: 'hello' })
  })

  it('handles partial chunks across reads', async () => {
    const line1 = JSON.stringify({ first: true })
    const line2 = JSON.stringify({ second: true })
    const full = line1 + '\n' + line2 + '\n'
    const mid = Math.floor(full.length / 2)

    const stream = makeChunkedStream([full.slice(0, mid), full.slice(mid)])
    const reader = createNdjsonReader(stream)

    const r1 = await reader.readLine()
    expect(r1).toBe(line1)
    const r2 = await reader.readLine()
    expect(r2).toBe(line2)
    const eof = await reader.readLine()
    expect(eof).toBeNull()
  })

  it('handles line split exactly at newline boundary', async () => {
    const line1 = JSON.stringify({ a: 1 })
    const stream = makeChunkedStream([
      line1 + '\n',
      JSON.stringify({ b: 2 }) + '\n',
    ])
    const reader = createNdjsonReader(stream)

    expect(await reader.readLine()).toBe(line1)
    expect(await reader.readLine()).toBe(JSON.stringify({ b: 2 }))
    expect(await reader.readLine()).toBeNull()
  })

  it('returns remaining buffer as last line when stream ends without trailing newline', async () => {
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('no-trailing-newline'))
        controller.close()
      },
    })
    const reader = createNdjsonReader(stream)
    expect(await reader.readLine()).toBe('no-trailing-newline')
    expect(await reader.readLine()).toBeNull()
  })

  it('returns null immediately for empty stream', async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.close()
      },
    })
    const reader = createNdjsonReader(stream)
    expect(await reader.readLine()).toBeNull()
  })

  it('cancel stops reading without error', async () => {
    let enqueuedAll = false
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('line1\nline2\n'))
        enqueuedAll = true
        controller.close()
      },
    })
    const reader = createNdjsonReader(stream)
    const first = await reader.readLine()
    expect(first).toBe('line1')
    reader.cancel()
    expect(enqueuedAll).toBe(true)
  })

  it('handles many small byte chunks (1 byte at a time)', async () => {
    const line = JSON.stringify({ data: 'test' })
    const bytes = new TextEncoder().encode(line + '\n')
    const stream = new ReadableStream({
      start(controller) {
        for (let i = 0; i < bytes.length; i++) {
          controller.enqueue(bytes.slice(i, i + 1))
        }
        controller.close()
      },
    })
    const reader = createNdjsonReader(stream)
    expect(await reader.readLine()).toBe(line)
    expect(await reader.readLine()).toBeNull()
  })
})
