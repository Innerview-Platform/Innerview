import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import * as Y from 'yjs'

process.env.JWT_SECRET ??= 'editor-storage-test-secret'
const { redis, store } = await import('../src/store.ts')
const prefix = `m4test${randomBytes(6).toString('hex')}`
const rooms = ['code', 'notes', 'private', 'replay', 'closed', 'legacy'].map((kind) => `${prefix}${kind}`)
before(async () => { await redis.connect() })
after(async () => {
  for (const room of rooms) {
    const keys = await redis.keys(`room:${room}:*`)
    if (keys.length) await redis.del(keys)
  }
  await store.close()
})

function document(kind: string, text: string) {
  const doc = new Y.Doc()
  doc.getText(kind).insert(0, text)
  return doc
}

test('code, notes and private documents survive client reconnect with independent text keys', async () => {
  for (const kind of ['code', 'notes', 'private']) {
    const room = `${prefix}${kind}`
    const doc = document(kind, `saved ${kind}`)
    await store.save(`${room}/${kind}`, Y.encodeStateAsUpdate(doc))
    doc.destroy()
  }
  await redis.quit()
  await redis.connect()
  for (const kind of ['code', 'notes', 'private']) {
    const room = `${prefix}${kind}`
    const restored = new Y.Doc()
    Y.applyUpdate(restored, (await store.load(`${room}/${kind}`))!)
    assert.equal(restored.getText(kind).toString(), `saved ${kind}`)
    const keyPrefix = kind === 'code' ? `room:${room}` : `room:${room}:${kind}`
    assert.equal(await redis.get(`${keyPrefix}:text`), `saved ${kind}`)
    assert.equal(await redis.ttl(`${keyPrefix}:state`), -1)
    restored.destroy()
  }
})

test('replay preserves binary updates in order and reconstructs the final code', async () => {
  const name = `${prefix}replay/code`
  const doc = new Y.Doc()
  let vector = Y.encodeStateVector(doc)
  doc.getText('code').insert(0, 'one')
  const first = Y.encodeStateAsUpdate(doc, vector)
  vector = Y.encodeStateVector(doc)
  doc.getText('code').insert(3, ' two')
  const second = Y.encodeStateAsUpdate(doc, vector)
  await store.appendUpdate(name, first)
  await store.appendUpdate(name, second)
  const updates = await store.updates(name)
  assert.equal(updates.length, 2)
  assert.deepEqual(updates[0].data, Buffer.from(first))
  assert.deepEqual(updates[1].data, Buffer.from(second))
  const replay = new Y.Doc()
  for (const row of updates) Y.applyUpdate(replay, row.data)
  assert.equal(replay.getText('code').toString(), 'one two')
  doc.destroy(); replay.destroy()
})

test('ended-room markers survive reconnect and repeated close calls preserve the original timestamp', async () => {
  const room = `${prefix}closed`
  assert.equal(await store.isClosed(room), false)
  await store.closeRoom(room)
  const timestamp = await redis.get(`room:${room}:editor:closedAt`)
  await store.closeRoom(room)
  assert.equal(await redis.get(`room:${room}:editor:closedAt`), timestamp)
  await redis.quit(); await redis.connect()
  assert.equal(await store.isClosed(room), true)
})

test('existing Spring base64 code state is readable and saving clears legacy expirations', async () => {
  const room = `${prefix}legacy`
  const doc = document('code', 'legacy Redis code')
  await redis.set(`room:${room}:state`, Buffer.from(Y.encodeStateAsUpdate(doc)).toString('base64'), { EX: 60 })
  await redis.set(`room:${room}:version`, '7', { EX: 60 })
  const restored = new Y.Doc()
  Y.applyUpdate(restored, (await store.load(`${room}/code`))!)
  assert.equal(restored.getText('code').toString(), 'legacy Redis code')
  await store.save(`${room}/code`, Y.encodeStateAsUpdate(restored))
  assert.equal(await redis.get(`room:${room}:version`), '8')
  assert.equal(await redis.ttl(`room:${room}:version`), -1)
  assert.equal(await redis.ttl(`room:${room}:state`), -1)
  doc.destroy(); restored.destroy()
})

test('missing documents return null and malformed document names are rejected', async () => {
  assert.equal(await store.load(`${prefix}code/notes`), null)
  await assert.rejects(store.load(`${prefix}code/private/extra`), /Invalid document name/)
})
