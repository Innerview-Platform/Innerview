import { Client } from '@stomp/stompjs'
import * as Y from 'yjs'
const ROOM = 'VvtopB', B = 'http://localhost:8080'
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a)
const login = await fetch(`${B}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'bob@innerview.test', password: 'Passw0rd!' }) })
const token = login.headers.get('authorization').slice(7)
const auth = { Authorization: `Bearer ${token}` }
log('join', (await fetch(`${B}/api/rooms/${ROOM}/join`, { method: 'POST', headers: auth })).status)
const doc = new Y.Doc(); const text = doc.getText('code')
const toB64 = (u) => Buffer.from(u).toString('base64')
const sendState = (c) => c.publish({ destination: '/app/signal.send', body: JSON.stringify({ type: 'CODE_UPDATE', roomId: ROOM, payload: { base64Vector: toB64(Y.encodeStateAsUpdate(doc)), plainText: text.toString() } }) })
const c = new Client({ brokerURL: 'ws://localhost:8080/ws-signal/websocket', connectHeaders: { ...auth, roomId: ROOM }, reconnectDelay: 0, debug: () => {} })
c.onConnect = () => {
  c.subscribe(`/topic/room/${ROOM}`, (m) => log('room:', m.body.slice(0, 120)))
  c.subscribe(`/topic/room/${ROOM}/roles`, (m) => log('roles:', m.body))
  c.subscribe(`/topic/room/${ROOM}/code`, (m) => {
    const { base64Vector } = JSON.parse(m.body)
    if (!base64Vector) return
    const before = text.toString()
    try { Y.applyUpdate(doc, Buffer.from(base64Vector, 'base64'), 'remote') } catch (e) { log('bad update', e.message) }
    if (text.toString() !== before) log('code now:', JSON.stringify(text.toString()))
  })
  c.publish({ destination: '/app/signal.send', body: JSON.stringify({ type: 'JOIN', roomId: ROOM }) })
  c.publish({ destination: '/app/signal.send', body: JSON.stringify({ type: 'JOIN_FEATURE', roomId: ROOM, payload: { element: 'SHARED_EDITOR' } }) })
  log('stomp connected')
}
c.activate()
await new Promise((r) => setTimeout(r, 5000))
text.insert(text.length, '\n  // bob: use a hash map\n}')
sendState(c); log('bob sent edit; code:', JSON.stringify(text.toString()))
await new Promise((r) => setTimeout(r, Number(process.env.STAY_MS || 60000)))
log('leave', (await fetch(`${B}/api/rooms/${ROOM}/leave`, { method: 'POST', headers: auth })).status)
await c.deactivate(); log('done'); process.exit(0)
