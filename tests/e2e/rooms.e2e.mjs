// Room management end-to-end: auth refresh, invites, lobby, tickets, presence, roles, chat,
// documents (Hocuspocus), removal, host hand-off, end, feedback and replay.
// Run: TEST_PASSWORD=... node tests/e2e/rooms.e2e.mjs   (see tests/e2e/README.md)
import { createRequire } from 'node:module'
// Uses the frontend's dependencies (STOMP, Hocuspocus provider, Yjs).
const require = createRequire(new URL('../../frontend/package.json', import.meta.url))
const { Client } = require('@stomp/stompjs')
const { HocuspocusProvider } = require('@hocuspocus/provider')
const Y = require('yjs')

const API = process.env.API ?? 'http://localhost:8080'
const EDITOR_WS = process.env.EDITOR_WS ?? 'ws://localhost:1234'
const EDITOR_HTTP = EDITOR_WS.replace(/^ws/, 'http')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let failures = 0
const check = (id, ok, msg) => { if (!ok) failures++; console.log(`${ok ? 'PASS' : 'FAIL'} ${id.padEnd(4)} ${msg}`) }

async function login(email) {
  const res = await fetch(`${API}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: process.env.TEST_PASSWORD }) })
  return { token: res.headers.get('authorization').slice(7), cookie: res.headers.get('set-cookie').split(';')[0], id: (await res.json()).id }
}
const api = (token) => async (method, path, body) => {
  const res = await fetch(`${API}${path}`, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: body && JSON.stringify(body) })
  const text = await res.text(); let parsed = text; try { parsed = JSON.parse(text) } catch {}
  return { status: res.status, body: parsed }
}
function stomp(ticket, code, clientId = Math.random().toString(36).slice(2), takeover = false) {
  const topics = {}, queues = {}
  const c = new Client({ brokerURL: `${API.replace(/^http/, 'ws')}/ws-signal/websocket`, connectHeaders: { ticket, clientId, ...(takeover ? { takeover: 'true' } : {}) }, reconnectDelay: 0, debug: () => {} })
  const ready = new Promise((res) => {
    c.onConnect = () => {
      for (const t of ['state', 'chat', 'close', 'notice', 'run']) c.subscribe(`/topic/room/${code}/${t}`, (m) => (topics[t] ??= []).push(JSON.parse(m.body)))
      for (const q of ['lobby', 'session', 'errors']) c.subscribe(`/user/queue/${q}`, (m) => (queues[q] ??= []).push(JSON.parse(m.body)))
      res(true)
    }
    c.onStompError = (f) => res(f.headers.message)
    c.onWebSocketClose = () => res(false)
  })
  c.activate()
  return { ready, topics, queues, client: c, send: (type, payload) => c.publish({ destination: '/app/signal.send', body: JSON.stringify({ type, roomId: code, payload: payload ?? null }) }), close: () => c.deactivate() }
}
const last = (arr) => arr?.[arr.length - 1]

const [alice, bob, carol] = await Promise.all(['alice', 'bob', 'carol'].map((u) => login(`${u}.runner@innerview.test`)))
const A = api(alice.token), B = api(bob.token), C = api(carol.token)

// ── auth: refresh via cookie, refresh token can't be used as an access token ──
const refresh = await fetch(`${API}/api/auth/refresh`, { method: 'POST', headers: { Cookie: alice.cookie } })
const refreshed = await refresh.json()
check('A1', refresh.status === 200 && refreshed.accessToken && refreshed.email === 'alice.runner@innerview.test', `refresh from httpOnly cookie → ${refresh.status}`)
const refreshJwt = alice.cookie.split('=')[1]
check('A2', (await api(refreshJwt)('GET', '/api/interviews/upcoming')).status === 401, 'refresh token rejected as an access token')
const reuse = await fetch(`${API}/api/auth/refresh`, { method: 'POST', headers: { Cookie: alice.cookie } })
check('A3', reuse.status >= 400, `rotated (old) refresh token refused → ${reuse.status}`)
alice.token = refreshed.accessToken
const A2 = api(alice.token)

// ── create with invite + new code format ──
const created = await A2('POST', '/api/interviews/instant', { interviewType: 'PROBLEM_SOLVING', roomSize: 'MANY', creatorInterviewRole: 'INTERVIEWER', title: 'Two Sum practice', invitees: [{ email: 'bob.runner@innerview.test', role: 'INTERVIEWEE' }] })
const { roomId: code, displayCode, roomLink, interviewId } = created.body
check('C1', /^[a-z]{10}$/.test(code) && /^[a-z]{3}-[a-z]{4}-[a-z]{3}$/.test(displayCode) && roomLink.endsWith('/' + displayCode), `code ${displayCode}, link ${roomLink}`)
const upper = displayCode.toUpperCase()
const accB = (await B('GET', `/api/rooms/${upper}/access`)).body
check('C2', accB.access === 'INVITED' && accB.canJoin && accB.code === code, `Bob (invited) via "${upper}" → ${accB.access}`)
const accC = (await C('GET', `/api/rooms/${code}/access`)).body
check('C3', accC.access === 'MUST_ASK' && !accC.canJoin, `Carol (not invited) → ${accC.access}`)
const cJoin = await C('POST', `/api/rooms/${code}/join`)
check('C4', cJoin.status === 403 && cJoin.body.code === 'MUST_ASK', `Carol can't join directly → ${cJoin.status} ${cJoin.body.code}`)
const vid = await C('GET', `/api/rooms/${code}/token`)
check('C5', vid.status >= 400, `Carol can't get a video token → ${vid.status}`)

// ── host joins, connects ──
const aJoin = (await A2('POST', `/api/rooms/${code}/join`)).body
check('J1', aJoin.ticket && aJoin.me.host && aJoin.me.staff, `Alice joins as host (role ${aJoin.me.role})`)
const aS = stomp(aJoin.ticket, code); check('J2', (await aS.ready) === true, 'Alice STOMP CONNECT with ticket')
const bad = stomp('not-a-ticket', code); check('J3', (await bad.ready) !== true, 'CONNECT without a valid ticket refused')
const spy = stomp((await A2('POST', `/api/rooms/${code}/ticket`)).body.ticket, code); await spy.ready
spy.client.subscribe(`/topic/room/zzzzzzzzzz/state`, () => {}); await sleep(600)
check('J4', !spy.client.connected, 'subscribing to another room\'s topic closes that session')

// ── lobby ──
const knock = (await C('POST', `/api/rooms/${code}/knock`)).body
await sleep(500)
const lobbyMsg = last(aS.queues.lobby)
check('L1', knock.status === 'PENDING' && lobbyMsg?.type === 'REQUEST' && lobbyMsg.request.userId === carol.id, `Carol knocks → host notified (${lobbyMsg?.request?.name})`)
check('L2', (await C('GET', `/api/rooms/${code}/access`)).body.access === 'PENDING', 'Carol sees PENDING while waiting')
const reqs = (await A2('GET', `/api/rooms/${code}/requests`)).body
check('L3', reqs.length === 1, `host lists ${reqs.length} pending request`)
const cantAdmit = await C('POST', `/api/rooms/${code}/requests/${knock.id}/admit`)
check('L4', cantAdmit.status === 403, `Carol can't admit herself → ${cantAdmit.status}`)
await A2('POST', `/api/rooms/${code}/requests/${knock.id}/admit`, { role: 'OBSERVER' })
const accC2 = (await C('GET', `/api/rooms/${code}/access`)).body
check('L5', accC2.access === 'ADMITTED' && accC2.canJoin && accC2.role === 'OBSERVER', `admitted as ${accC2.role}`)

// ── Bob and Carol enter ──
const bJoin = (await B('POST', `/api/rooms/${code}/join`)).body
const bS = stomp(bJoin.ticket, code); await bS.ready
const cJoin2 = (await C('POST', `/api/rooms/${code}/join`)).body
const cS = stomp(cJoin2.ticket, code); await cS.ready
await sleep(500)
let st = last(aS.topics.state)
check('P1', st?.participants.filter((p) => p.status === 'CONNECTED').length === 3, `3 connected: ${st?.participants.map((p) => `${p.name}:${p.role}:${p.status}`).join(', ')}`)

// ── presence: second tab + takeover, crash grace ──
const bJoinAgain = (await B('POST', `/api/rooms/${code}/join`)).body
check('P2', bJoinAgain.alreadyConnected === true, 'Bob opening a second tab → alreadyConnected (UI offers "Join here")')
const bS2 = stomp(bJoinAgain.ticket, code, 'tab-2', true); await bS2.ready; await sleep(400)
check('P3', last(bS.queues.session)?.type === 'REPLACED', 'first tab told it was replaced')
st = last(aS.topics.state)
check('P4', st.participants.filter((p) => p.name.startsWith('Bob')).length === 1, 'still one Bob in the participant list')
await bS.close(); await bS2.close(); await sleep(600)
st = last(aS.topics.state)
check('P5', st.participants.find((p) => p.userId === bob.id).status === 'RECONNECTING', `Bob's tabs closed → ${st.participants.find((p) => p.userId === bob.id).status} (60 s grace)`)
const bBack = (await B('POST', `/api/rooms/${code}/join`)).body
const bS3 = stomp(bBack.ticket, code); await bS3.ready; await sleep(400)
check('P6', last(aS.topics.state).participants.find((p) => p.userId === bob.id).status === 'CONNECTED', 'Bob back within grace → CONNECTED, no knock needed')

// ── observers are read-only; runner lock ──
cS.send('RUN_CODE', { language: 'python', plainText: 'print(1)' }); await sleep(500)
check('R1', last(cS.queues.errors)?.code === 'READ_ONLY', `observer can't run code → ${last(cS.queues.errors)?.code}`)
aS.send('RUN_CODE', { language: 'python', plainText: 'import time\ntime.sleep(5)\n' }); await sleep(1200)
bS3.send('RUN_CODE', { language: 'python', plainText: 'print(2)' }); await sleep(600)
check('R2', last(bS3.queues.errors)?.code === 'RUN_BUSY', `Bob presses Run during Alice's run → ${last(bS3.queues.errors)?.code} (asks before stopping it)`)
bS3.send('RUN_CODE', { language: 'python', plainText: 'print(2)', force: true }); await sleep(2500)
check('R3', (aS.topics.run ?? []).some((e) => e.type === 'stopped' && e.userId === bob.id), 'forced run stops Alice\'s and says who stopped it')

// ── roles, chat ──
const selfPromote = await B('POST', `/api/rooms/${code}/participants/${bob.id}/role`, { role: 'INTERVIEWER' })
check('O1', selfPromote.status === 403, `candidate can't change roles → ${selfPromote.status} ${selfPromote.body.code}`)
await A2('POST', `/api/rooms/${code}/swap-roles`); await sleep(400)
st = last(aS.topics.state)
check('O2', st.participants.find((p) => p.userId === bob.id).role === 'INTERVIEWER' && st.participants.find((p) => p.userId === alice.id).role === 'INTERVIEWEE' && st.hostId === alice.id,
  'swap roles: Bob interviewer, Alice candidate, Alice still host')
check('O3', last(bS3.queues.session)?.type === 'PERMISSIONS', 'Bob told to refresh his ticket (new permissions)')
await A2('POST', `/api/rooms/${code}/swap-roles`)
bS3.send('CHAT_SEND', { text: 'here is the link: https://example.com' }); await sleep(400)
check('H1', last(aS.topics.chat)?.text.startsWith('here is the link'), 'chat delivered to the room')
check('H2', (await C('GET', `/api/rooms/${code}/chat`)).body.length === 1, 'chat history available')

// ── documents via Hocuspocus ──
const doc = new Y.Doc()
const bTicket = (await B('POST', `/api/rooms/${code}/ticket`)).body.ticket
const provider = new HocuspocusProvider({ url: EDITOR_WS, name: `${code}/code`, document: doc, token: bTicket })
await new Promise((r) => provider.on('synced', r))
doc.getText('code').insert(0, 'def two_sum(nums, target):\n    pass\n')
const cDoc = new Y.Doc()
const cTicket = (await C('POST', `/api/rooms/${code}/ticket`)).body.ticket
const cProv = new HocuspocusProvider({ url: EDITOR_WS, name: `${code}/code`, document: cDoc, token: cTicket })
await new Promise((r) => cProv.on('synced', r)); await sleep(400)
check('D1', cDoc.getText('code').toString().startsWith('def two_sum'), 'Carol (observer) sees Bob\'s code live')
cDoc.getText('code').insert(0, '# observer edit\n'); await sleep(500)
check('D2', !doc.getText('code').toString().includes('observer edit'), 'observer edits are not accepted (read-only)')
const priv = new HocuspocusProvider({ url: EDITOR_WS, name: `${code}/private`, document: new Y.Doc(), token: cTicket })
const privDenied = await new Promise((r) => { priv.on('authenticationFailed', () => r(true)); priv.on('synced', () => r(false)); setTimeout(() => r(true), 3000) })
check('D3', privDenied, 'observer denied the private interviewer notes')
const big = 'x'.repeat(300_000)
doc.getText('code').insert(doc.getText('code').length, `\n# ${big}\n`); await sleep(1500)
check('D4', cDoc.getText('code').length > 300_000, `300 KB document syncs (${Math.round(cDoc.getText('code').length / 1024)} KB)`)
doc.getText('code').delete(doc.getText('code').length - big.length - 4, big.length + 4); await sleep(3000)

// ── remove ──
await A2('POST', `/api/rooms/${code}/participants/${carol.id}/remove`); await sleep(600)
check('X1', last(cS.queues.session)?.type === 'REMOVED', 'Carol told she was removed')
const cAgain = (await C('GET', `/api/rooms/${code}/access`)).body
check('X2', cAgain.access === 'REMOVED' && !cAgain.canJoin, `Carol can't come back → ${cAgain.access}`)
check('X3', (await C('POST', `/api/rooms/${code}/ticket`)).status === 403, 'Carol can\'t get a new ticket')

// ── leave vs end, host hand-off ──
await A2('POST', `/api/rooms/${code}/leave`); await sleep(400)
st = last(bS3.topics.state)
check('E1', st.hostId === bob.id, 'host leaves → host rights pass to Bob')
const aBack = (await A2('POST', `/api/rooms/${code}/join`)).body
check('E2', aBack.me.host, 'owner comes back → host again')
const aS2 = stomp(aBack.ticket, code); await aS2.ready
await A2('POST', `/api/rooms/${code}/extend`); await sleep(300)
const ext = await A2('POST', `/api/rooms/${code}/extend`)
check('E3', ext.status === 409 && last(bS3.topics.notice)?.type === 'EXTENDED', 'extend works once, second time refused')
await sleep(2500)
const candidateEnd = await B('POST', `/api/rooms/${code}/end`)
check('E4a', candidateEnd.status === 403, `candidate can't end the interview → ${candidateEnd.status}`)
const end = await A2('POST', `/api/rooms/${code}/end`)
await sleep(800)
check('E4', end.status === 204 && last(bS3.topics.close)?.reason === 'ENDED_BY_HOST', `host ends → room closed for everyone (${last(bS3.topics.close)?.message})`)
check('E5', (await B('GET', `/api/rooms/${code}/access`)).body.access === 'ENDED', 'access after end → ENDED')
const details = (await B('GET', `/api/interviews/${interviewId}`)).body
check('E6', details.status === 'COMPLETED' && details.sharedCode?.startsWith('def two_sum') && details.chat.length === 1 && details.participants.length === 3,
  `saved: status ${details.status}, code ${details.sharedCode?.length} chars, chat ${details.chat.length}, participants ${details.participants.length}`)
check('E7', details.interviewerNotes !== undefined, 'interviewer notes field present for staff')

// ── feedback ──
const form = (await A2('GET', `/api/interviews/${interviewId}/feedback`)).body
const bobRev = form.reviewees.find((r) => r.userId === bob.id)
check('F1', bobRev && bobRev.criteria.length === 5 && bobRev.hireSignal, `Alice can review Bob with ${bobRev?.criteria.length} criteria + hire signal`)
const scores = Object.fromEntries(bobRev.criteria.map((c) => [c.id, 4]))
const fb = await A2('POST', `/api/interviews/${interviewId}/feedback`, { revieweeId: bob.id, rating: 4, comment: 'Good approach', scores, hireSignal: 'LEAN_YES' })
check('F2', fb.status === 200, `feedback saved → ${fb.status}`)
check('F3', (await A2('POST', `/api/interviews/${interviewId}/feedback`, { revieweeId: bob.id, rating: 5 })).status === 409, 'second review of the same person refused')
const bForm = (await B('GET', `/api/interviews/${interviewId}/feedback`)).body
check('F4', bForm.received.length === 1 && bForm.received[0].hireSignal === 'LEAN_YES', 'Bob sees the feedback he received')
const review = (await B('POST', `/api/interviews/${interviewId}/review-ticket`)).body
const replay = await (await fetch(`${EDITOR_HTTP}/replay/${code}?token=${review.ticket}`)).json()
check('F5', review.readonly && replay.updates.length >= 3, `review ticket (read-only) + replay timeline with ${replay.updates.length} updates`)
const upcoming = (await B('GET', '/api/interviews/upcoming')).body
check('F6', !upcoming.some((u) => u.id === interviewId), 'ended interview gone from upcoming')

for (const s of [aS, aS2, bS3, cS]) await s.close()
provider.destroy(); cProv.destroy(); priv.destroy()
console.log(failures ? `${failures} FAILURE(S)` : 'ALL PASSED')
process.exit(failures ? 1 : 0)
