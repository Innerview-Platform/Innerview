/**
 * InnerView collaborative documents — a Hocuspocus (Yjs) server.
 *
 * Each interview room has three documents, named `{room}/{kind}`:
 *   code     the shared code editor
 *   notes    the problem statement / discussion notes
 *   private  interviewers' private notes (host and interviewers only)
 *
 * Clients authenticate with a room ticket from the backend. Documents are persisted to SQLite,
 * and the code document's updates are kept as a replay timeline. The backend pulls final document
 * contents when an interview ends.
 *
 *   WS   /                          Hocuspocus (document name + ticket in the auth message)
 *   GET  /replay/:room?token=…      code history for the interview summary (room/review ticket)
 *   GET  /health
 *   POST /internal/rooms/:room/flush    current text of every document     (X-Internal-Token)
 *   POST /internal/rooms/:room/revoke   drop a user's connections          (X-Internal-Token)
 *   POST /internal/rooms/:room/close    interview ended: disconnect + read-only
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import { Database } from '@hocuspocus/extension-database'
import { Server, type Hocuspocus } from '@hocuspocus/server'
import * as Y from 'yjs'
import { config } from './config.ts'
import { store } from './store.ts'
import { verifyTicket, type Ticket } from './tickets.ts'

const KINDS = ['code', 'notes', 'private'] as const
type Kind = (typeof KINDS)[number]

interface Context extends Ticket {
  kind: Kind
}

function parseName(documentName: string): { room: string; kind: Kind } | null {
  const [room, kind, ...rest] = documentName.split('/')
  if (rest.length || !room || !/^[a-z0-9]{1,32}$/.test(room) || !KINDS.includes(kind as Kind)) return null
  return { room, kind: kind as Kind }
}

function textOf(kind: Kind, state: Uint8Array | null): string {
  const doc = new Y.Doc()
  if (state) Y.applyUpdate(doc, state)
  return doc.getText(kind).toString()
}

const server = new Server<Context>({
  port: config.port,
  address: config.host,
  quiet: true,
  // Persist 2 s after the last change, and at least every 10 s while people keep typing.
  debounce: 2_000,
  maxDebounce: 10_000,
  websocketOptions: { maxPayload: 16 * 1024 * 1024 },
  extensions: [
    new Database({
      fetch: async ({ documentName }) => store.load(documentName),
      store: async ({ documentName, state }) => {
        store.save(documentName, state)
      },
    }),
  ],

  async onAuthenticate({ token, documentName, connectionConfig }) {
    const ticket = await verifyTicket(token)
    const target = parseName(documentName)
    if (!ticket || !target || ticket.room !== target.room) throw new Error('not-authorized')
    if (target.kind === 'private' && !ticket.staff) throw new Error('not-authorized')
    // Observers, review tickets and ended interviews are read-only.
    if (ticket.readonly || store.isClosed(target.room)) connectionConfig.readOnly = true
    return { ...ticket, kind: target.kind }
  },

  async onChange({ documentName, update }) {
    if (documentName.endsWith('/code')) store.appendUpdate(documentName, update)
  },

  async onRequest({ request, response, instance }) {
    const handled = await handleHttp(request, response, instance)
    // Throwing null stops Hocuspocus from writing its default response.
    if (handled) throw null
  },
})

// ── HTTP ──────────────────────────────────────────────────────────────────────

function sendJson(response: ServerResponse, status: number, body: unknown) {
  response.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
  response.end(JSON.stringify(body))
}

async function readJson(request: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = []
  for await (const chunk of request) chunks.push(chunk as Buffer)
  try {
    return chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}
  } catch {
    return {}
  }
}

function roomConnections(instance: Hocuspocus<Context>, room: string) {
  const result = []
  for (const [name, document] of instance.documents) {
    if (!name.startsWith(`${room}/`)) continue
    for (const connection of document.connections.keys()) result.push({ name, connection })
  }
  return result
}

async function handleHttp(request: IncomingMessage, response: ServerResponse, instance: Hocuspocus<Context>): Promise<boolean> {
  const url = new URL(request.url ?? '/', 'http://localhost')

  if (url.pathname === '/health') {
    sendJson(response, 200, { status: 'UP', documents: instance.getDocumentsCount(), connections: instance.getConnectionsCount() })
    return true
  }

  const replay = url.pathname.match(/^\/(?:collab\/)?replay\/([a-z0-9]{1,32})$/)
  if (replay && request.method === 'GET') {
    const ticket = await verifyTicket(url.searchParams.get('token'))
    if (!ticket || ticket.room !== replay[1]) {
      sendJson(response, 401, { error: 'Unauthorized' })
      return true
    }
    const updates = store.updates(`${replay[1]}/code`).map((row) => ({ at: row.at, update: row.data.toString('base64') }))
    sendJson(response, 200, { updates })
    return true
  }

  const internal = url.pathname.match(/^\/internal\/rooms\/([a-z0-9]{1,32})\/(flush|revoke|close)$/)
  if (!internal) return false
  if (request.headers['x-internal-token'] !== config.internalToken) {
    sendJson(response, 401, { error: 'Unauthorized' })
    return true
  }
  const [, room, action] = internal

  if (action === 'flush') {
    instance.flushPendingStores()
    const texts: Record<string, string> = {}
    for (const kind of KINDS) {
      const live = instance.documents.get(`${room}/${kind}`)
      texts[kind] = live ? live.getText(kind).toString() : textOf(kind, store.load(`${room}/${kind}`))
    }
    sendJson(response, 200, texts)
    return true
  }

  if (action === 'revoke') {
    const body = await readJson(request)
    const kinds = Array.isArray(body.documents) ? (body.documents as string[]) : null
    let closed = 0
    for (const { name, connection } of roomConnections(instance, room)) {
      if (connection.context?.userId !== body.userId) continue
      if (kinds && !kinds.includes(name.split('/')[1])) continue
      connection.close({ code: 4403, reason: 'permissions-changed' })
      closed++
    }
    sendJson(response, 200, { closed })
    return true
  }

  // close: the interview ended.
  store.closeRoom(room)
  instance.flushPendingStores()
  for (const kind of KINDS) instance.closeConnections(`${room}/${kind}`)
  sendJson(response, 200, { closed: true })
  return true
}

await server.listen()
console.log(`[editor] Hocuspocus listening on ws://${config.host}:${config.port} (data in ${config.dataDir})`)

const shutdown = async () => {
  server.hocuspocus.flushPendingStores()
  await server.destroy()
  store.close()
  process.exit(0)
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
