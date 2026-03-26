import { describe, it, expect, afterEach } from 'vitest'
import net from 'net'
import { isPortAvailable, findAvailablePort } from '../cli/dev'

/** Create a server occupying a port. Returns a cleanup function. */
function occupyPort(port: number): Promise<() => Promise<void>> {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.listen(port, () => {
      resolve(
        () => new Promise<void>((res) => server.close(() => res())),
      )
    })
    server.on('error', reject)
  })
}

describe('isPortAvailable', () => {
  let cleanup: (() => Promise<void>) | undefined

  afterEach(async () => {
    await cleanup?.()
    cleanup = undefined
  })

  it('returns true for a free port', async () => {
    // Use a high ephemeral port to avoid collisions
    const result = await isPortAvailable(0)
    // Port 0 lets OS pick a random free port — but isPortAvailable binds to
    // a specific port, so use a high port instead
    expect(await isPortAvailable(19876)).toBe(true)
  })

  it('returns false for an occupied port', async () => {
    cleanup = await occupyPort(19877)
    expect(await isPortAvailable(19877)).toBe(false)
  })
})

describe('findAvailablePort', () => {
  let cleanups: (() => Promise<void>)[] = []

  afterEach(async () => {
    await Promise.all(cleanups.map((fn) => fn()))
    cleanups = []
  })

  it('returns the preferred port when it is free', async () => {
    const port = await findAvailablePort(19880)
    expect(port).toBe(19880)
  })

  it('skips occupied ports and returns the next available one', async () => {
    // Occupy 19881 and 19882
    cleanups.push(await occupyPort(19881))
    cleanups.push(await occupyPort(19882))

    const port = await findAvailablePort(19881)
    expect(port).toBe(19883)
  })

  it('returns the start port when only later ports are occupied', async () => {
    cleanups.push(await occupyPort(19886))

    const port = await findAvailablePort(19885)
    expect(port).toBe(19885)
  })
})
