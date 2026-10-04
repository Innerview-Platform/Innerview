import { test, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import WebSocket from 'ws'

process.env.JWT_SECRET = 'test-secret'
const { store } = await import('../src/store.ts')
const { getOrCreateRoom, closeAllRooms, closeRoom } = await import('../src/rooms.ts')
const data = new Map<string, { scene: string | null; closed: boolean }>()
store.load = async (id) => data.get(id) ?? { scene: null, closed: false }
const save = async (id: string, scene: string) => {
  data.set(id, { scene, closed: data.get(id)?.closed ?? false })
}
store.save = save
store.closeRoom = async (id) => { data.set(id, { scene: data.get(id)?.scene ?? null, closed: true }) }
afterEach(async () => { await closeAllRooms(); data.clear(); store.save = save })

class Socket extends EventEmitter {
  readyState = WebSocket.OPEN
  sent: any[] = []
  send(raw: string) { this.sent.push(JSON.parse(raw)) }
  close() { this.readyState = WebSocket.CLOSED; this.emit('close') }
  update(version: number) {
    this.emit('message', Buffer.from(JSON.stringify({ type: 'scene', scene: {
      elements: [{ id: 'shape', version }], files: { image: { dataURL: 'image-data' } },
    } })), false)
  }
}
function connect(room: Awaited<ReturnType<typeof getOrCreateRoom>>, readonly = false) {
  const socket = new Socket()
  room.connect({ socket: socket as unknown as WebSocket, userId: 'user', readonly })
  return socket
}

test('concurrent joins share a room; scene and images survive unloading', async () => {
  const [room, same] = await Promise.all([getOrCreateRoom('one'), getOrCreateRoom('one')])
  assert.equal(room, same)
  const socket = connect(room)
  socket.update(1)
  await room.flush()
  await closeAllRooms()
  const restored = connect(await getOrCreateRoom('one'))
  assert.equal(restored.sent[0].scene.elements[0].version, 1)
  assert.equal(restored.sent[0].scene.files.image.dataURL, 'image-data')
})

test('pending writes remain ordered across an immediate reconnect', async () => {
  let release!: () => void
  const gate = new Promise<void>((resolve) => { release = resolve })
  store.save = async (id, scene) => { await gate; await save(id, scene) }
  const room = await getOrCreateRoom('two')
  const first = connect(room)
  first.update(1)
  first.close()
  const rejoined = await getOrCreateRoom('two')
  assert.equal(room, rejoined)
  const second = connect(rejoined)
  second.update(2)
  second.close()
  release()
  await room.flush()
  await new Promise((resolve) => setImmediate(resolve))
  assert.equal(JSON.parse(data.get('two')!.scene!).elements[0].version, 2)
})

test('review tickets and persisted ended rooms reject edits', async () => {
  const room = await getOrCreateRoom('three')
  connect(room, true).update(1)
  await room.flush()
  assert.equal(data.has('three'), false)
  connect(room).update(2)
  await closeRoom('three')
  const restored = await getOrCreateRoom('three')
  connect(restored).update(3)
  await restored.flush()
  assert.equal(JSON.parse(data.get('three')!.scene!).elements[0].version, 2)
  assert.equal(data.get('three')!.closed, true)
})
