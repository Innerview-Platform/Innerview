import { createClient } from 'redis'
import * as Y from 'yjs'
import { config } from './config.ts'

export const redis = createClient({ url: config.redisUrl, disableOfflineQueue: true })
redis.on('error', (error) => console.error('[editor] Redis error', error))

// Code keys match Spring's RedisPersistenceService; notes have separate keys.
function keys(name: string) {
  const [room, kind, ...rest] = name.split('/')
  if (!/^[a-z0-9]{1,32}$/.test(room ?? '') || !['code', 'notes', 'private'].includes(kind) || rest.length) {
    throw new Error('Invalid document name')
  }
  const prefix = kind === 'code' ? `room:${room}` : `room:${room}:${kind}`
  return { state: `${prefix}:state`, text: `${prefix}:text`, version: `${prefix}:version`, updates: `room:${room}:editor:updates:${kind}`, kind }
}

export const store = {
  async load(name: string): Promise<Uint8Array | null> {
    const state = await redis.get(keys(name).state)
    return state === null ? null : Buffer.from(state, 'base64')
  },
  async save(name: string, state: Uint8Array): Promise<void> {
    const documentKeys = keys(name)
    const doc = new Y.Doc()
    try {
      Y.applyUpdate(doc, state)
      // Persist state, text and version together. SET removes legacy six-hour TTLs.
      await redis.multi()
        .set(documentKeys.state, Buffer.from(state).toString('base64'))
        .set(documentKeys.text, doc.getText(documentKeys.kind).toString())
        .incr(documentKeys.version)
        .persist(documentKeys.version)
        .exec()
    } finally {
      doc.destroy()
    }
  },
  async appendUpdate(name: string, update: Uint8Array): Promise<void> {
    await redis.rPush(keys(name).updates, JSON.stringify({ at: Date.now(), data: Buffer.from(update).toString('base64') }))
  },
  async updates(name: string): Promise<Array<{ at: number; data: Buffer }>> {
    return (await redis.lRange(keys(name).updates, 0, -1)).map((raw) => {
      const row = JSON.parse(raw) as { at: number; data: string }
      return { at: row.at, data: Buffer.from(row.data, 'base64') }
    })
  },
  async closeRoom(room: string): Promise<void> {
    // A retried close hook preserves the first end time.
    await redis.set(`room:${room}:editor:closedAt`, String(Date.now()), { NX: true })
  },
  async isClosed(room: string): Promise<boolean> {
    return (await redis.exists(`room:${room}:editor:closedAt`)) > 0
  },
  async close(): Promise<void> {
    if (redis.isOpen) await redis.quit()
  },
}
