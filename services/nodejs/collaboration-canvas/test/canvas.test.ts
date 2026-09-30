import assert from 'node:assert/strict'
import { spawn, type ChildProcess } from 'node:child_process'
import { createHmac } from 'node:crypto'
import { once } from 'node:events'
import { mkdtempSync, rmSync } from 'node:fs'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import test from 'node:test'
import Database from 'better-sqlite3'
import { SignJWT } from 'jose'
import WebSocket from 'ws'
import { isScene, mergeScene } from '../src/scene.ts'

const element = (id: string, version = 1, versionNonce = 10, index = 'a0') => ({ id, type: 'rectangle', version, versionNonce, index, isDeleted: false })

test('scene validation and deterministic Excalidraw reconciliation', () => {
  for (const invalid of [null, [], { elements: [null], files: {} }, { elements: [element('a', -1)], files: {} },
    { elements: [element('a'), element('a')], files: {} }]) assert.equal(isScene(invalid), false)
  const current = { elements: [element('a', 2, 10, 'a1')], files: {} }
  const next = mergeScene(current, { elements: [element('b', 1, 10, 'a0'), element('a', 2, 5, 'a1')], files: {} })
  assert.deepEqual(next.elements.map((entry) => entry.id), ['b', 'a'])
  assert.equal(next.elements[1].versionNonce, 5)
  assert.equal(mergeScene(next, { elements: [element('a', 1)], files: {} }).elements[1].version, 2)
  assert.equal(mergeScene(next, { elements: [{ ...element('a', 3), isDeleted: true }], files: {} }).elements.find((entry) => entry.id === 'a')?.isDeleted, true)
})

test('authenticated live collaboration, images, persistence, read-only access and room lifecycle', { timeout: 30_000 }, async (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'innerview-canvas-test-'))
  const secret = 'isolated-canvas-test-secret'
  const signingKey = createHmac('sha256', secret).update('innerview-room-ticket').digest()
  const internalToken = createHmac('sha256', secret).update('innerview-internal').digest('hex')
  const listener = createServer().listen(0, '127.0.0.1')
  await once(listener, 'listening')
  const port = (listener.address() as { port: number }).port
  await new Promise<void>((resolve) => listener.close(() => resolve()))
  let server: ChildProcess | undefined
  let logs = ''
  const sockets: WebSocket[] = []
  const start = async () => {
    server = spawn(process.execPath, ['--import', 'tsx', 'src/index.ts'], {
      cwd: process.cwd(), env: { ...process.env, JWT_SECRET: secret, CANVAS_PORT: String(port), CANVAS_HOST: '127.0.0.1', CANVAS_DATA_DIR: directory },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    server.stdout?.on('data', (data) => { logs += data })
    server.stderr?.on('data', (data) => { logs += data })
    for (let attempt = 0; attempt < 100; attempt++) {
      if (server.exitCode !== null) throw new Error(logs)
      try { if ((await fetch(`http://127.0.0.1:${port}/health`)).ok) return } catch { /* wait for listen */ }
      await delay(30)
    }
    throw new Error(`Server did not start: ${logs}`)
  }
  const stop = async () => {
    if (!server || server.exitCode !== null) return
    const exited = once(server, 'exit')
    server.kill('SIGTERM')
    await exited
  }
  t.after(async () => { sockets.forEach((socket) => socket.terminate()); await stop(); rmSync(directory, { recursive: true, force: true }) })
  const ticket = (user = 'alice', readonly = false, room = 'TEST') => new SignJWT({ typ: 'room', room, readonly, name: user })
    .setProtectedHeader({ alg: 'HS256' }).setSubject(user).setExpirationTime('10m').sign(signingKey)
  const connect = async (token: string, room = 'TEST') => {
    const socket = new WebSocket(`ws://127.0.0.1:${port}/connect/${room}?token=${encodeURIComponent(token)}`)
    sockets.push(socket)
    const messages: any[] = []
    socket.on('message', (raw) => { messages.push(JSON.parse(raw.toString())) })
    const closed = new Promise<{ code: number }>((resolve) => socket.on('close', (code) => resolve({ code })))
    await once(socket, 'open')
    const waitFor = async (predicate: (message: any) => boolean) => {
      for (let attempt = 0; attempt < 150; attempt++) {
        const index = messages.findIndex(predicate)
        if (index >= 0) return messages.splice(index, 1)[0]
        await delay(10)
      }
      throw new Error(`Missing message. Received: ${JSON.stringify(messages)}; logs: ${logs}`)
    }
    return { socket, messages, closed, waitFor, send: (scene: unknown) => socket.send(JSON.stringify({ type: 'scene', scene })) }
  }
  const action = (name: string, body = {}) => fetch(`http://127.0.0.1:${port}/internal/rooms/TEST/${name}`, {
    method: 'POST', headers: { 'X-Internal-Token': internalToken, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  })

  await start()
  const denied = await connect('bad-ticket')
  assert.equal((await denied.closed).code, 4401)
  const wrongRoom = await connect(await ticket('alice', false, 'OTHER'))
  assert.equal((await wrongRoom.closed).code, 4403)
  const alice = await connect(await ticket())
  assert.equal((await alice.waitFor((message) => message.type === 'scene')).readonly, false)
  const bob = await connect(await ticket('bob'))
  await bob.waitFor((message) => message.type === 'scene')
  alice.socket.send('null')
  alice.socket.send('{')
  alice.send({ elements: [null], files: {} })
  alice.send({ elements: [element('a')], files: {} })
  await bob.waitFor((message) => message.type === 'scene' && message.scene.elements.some((entry: any) => entry.id === 'a'))
  bob.send({ elements: [element('b', 1, 10, 'a1')], files: {} })
  await alice.waitFor((message) => message.type === 'scene' && message.scene.elements.length === 2)
  alice.socket.send(JSON.stringify({ type: 'presence', pointer: { x: 12, y: 34 }, button: 'down', selectedElementIds: { a: true } }))
  const presence = await bob.waitFor((message) => message.type === 'presence' && message.peers.some((peer: any) => peer.pointer?.x === 12))
  assert.equal(presence.peers.find((peer: any) => peer.pointer?.x === 12).name, 'alice')
  const file = { id: 'image', mimeType: 'image/png', dataURL: 'data:image/png;base64,aGVsbG8=', created: Date.now() }
  alice.send({ elements: [{ ...element('image'), type: 'image', fileId: 'image' }], files: { image: file } })
  await bob.waitFor((message) => message.type === 'scene' && message.scene.files.image)
  const observer = await connect(await ticket('observer', true))
  assert.equal((await observer.waitFor((message) => message.type === 'scene')).readonly, true)
  observer.send({ elements: [element('unauthorized')], files: {} })
  alice.send({ elements: [element('a', 2)], files: {} })
  const observed = await observer.waitFor((message) => message.type === 'scene' && message.scene.elements.some((entry: any) => entry.version === 2))
  assert.equal(observed.scene.elements.some((entry: any) => entry.id === 'unauthorized'), false)
  assert.equal((await action('revoke', { userId: 'bob' })).status, 200)
  assert.equal((await bob.closed).code, 4403)
  await stop()
  await start()
  const reopened = await connect(await ticket())
  const persisted = (await reopened.waitFor((message) => message.type === 'scene')).scene
  assert.equal(persisted.elements.length, 3)
  assert.equal(persisted.files.image.dataURL, file.dataURL)
  assert.equal((await action('close')).status, 200)
  await reopened.closed
  const review = await connect(await ticket('reviewer'))
  const summary = await review.waitFor((message) => message.type === 'scene')
  assert.equal(summary.readonly, true)
  assert.equal(summary.scene.elements.length, 3)
  const db = new Database(join(directory, 'rooms', 'TEST.db'), { readonly: true })
  assert.ok(db.prepare('SELECT data FROM excalidraw_scene WHERE id = 1').get())
  db.close()
})
