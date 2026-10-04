/**
 * InnerView shared whiteboard — a self-hosted tldraw sync server.
 *
 *   WS   /connect/:roomId?sessionId=…&token=…   multiplayer sync for one room (token = room ticket)
 *   PUT  /uploads/:id                            upload an image/video (Authorization: Bearer <room ticket>)
 *   GET  /uploads/:id                            serve an uploaded asset
 *   GET  /health
 *   POST /internal/rooms/:room/revoke|close       backend only (X-Internal-Token)
 *
 * Based on tldraw's simple-server-example, plus InnerView JWT checks and SQLite persistence.
 */
import cors from '@fastify/cors'
import websocketPlugin from '@fastify/websocket'
import { TLSyncErrorCloseEventCode, TLSyncErrorCloseEventReason } from '@tldraw/sync-core'
import fastify, { LogController } from 'fastify'
import type { RawData } from 'ws'
import { ASSET_ID_PATTERN, isAllowedContentType, loadAsset, storeAsset } from './assets.ts'
import { bearerToken, internalToken, verifyTicket } from './auth.ts'
import { config } from './config.ts'
import { activeRoomCount, closeAllRooms, closeRoom, deleteOldRooms, getOrCreateRoom, isRoomClosed, revokeUser, ROOM_ID_PATTERN } from './rooms.ts'

// Request logging is off because sync URLs carry the access token in their query string.
const app = fastify({
  logger: { level: 'warn' },
  logController: new LogController({ disableRequestLogging: true }),
  bodyLimit: config.maxUploadBytes,
})

await app.register(websocketPlugin, { options: { maxPayload: 8 * 1024 * 1024 } })
await app.register(cors, { origin: config.corsOrigins, methods: ['GET', 'PUT'] })

app.get('/health', async () => ({ status: 'UP', rooms: activeRoomCount() }))

app.get<{ Params: { roomId: string }; Querystring: { sessionId?: string; token?: string } }>(
  '/connect/:roomId',
  { websocket: true },
  async (socket, req) => {
    // Messages can arrive while the token is verified; hold them and replay once the room is attached.
    const caught: RawData[] = []
    const collect = (message: RawData) => caught.push(message)
    socket.on('message', collect)

    const { roomId } = req.params
    const { sessionId, token } = req.query
    const ticket = await verifyTicket(token)

    if (!ticket) {
      socket.close(TLSyncErrorCloseEventCode, TLSyncErrorCloseEventReason.NOT_AUTHENTICATED)
      return
    }
    if (!ROOM_ID_PATTERN.test(roomId) || !sessionId) {
      socket.close(TLSyncErrorCloseEventCode, TLSyncErrorCloseEventReason.NOT_FOUND)
      return
    }
    if (ticket.room !== roomId) {
      socket.close(TLSyncErrorCloseEventCode, TLSyncErrorCloseEventReason.FORBIDDEN)
      return
    }

    // Observers, review tickets and ended interviews see the board but can't change it.
    const isReadonly = ticket.readonly || isRoomClosed(roomId)
    getOrCreateRoom(roomId).handleSocketConnect({ sessionId, socket, isReadonly, meta: { userId: ticket.userId } })
    console.log(`[canvas] user ${ticket.userId} joined room ${roomId}${isReadonly ? ' (read-only)' : ''}`)

    socket.off('message', collect)
    for (const message of caught) socket.emit('message', message)
  },
)

// Uploads keep their raw bytes; tldraw sends the file as the request body.
app.addContentTypeParser('*', { parseAs: 'buffer' }, (_req, body, done) => done(null, body))

app.put<{ Params: { id: string } }>('/uploads/:id', async (req, reply) => {
  const ticket = await verifyTicket(bearerToken(req.headers.authorization))
  if (!ticket) return reply.code(401).send({ error: 'Unauthorized' })
  if (ticket.readonly || isRoomClosed(ticket.room)) return reply.code(403).send({ error: 'Read-only' })

  const { id } = req.params
  const contentType = req.headers['content-type']?.split(';')[0].trim()
  if (!ASSET_ID_PATTERN.test(id)) return reply.code(400).send({ error: 'Invalid asset id' })
  if (!isAllowedContentType(contentType)) return reply.code(415).send({ error: 'Only images and videos can be uploaded' })
  if (!Buffer.isBuffer(req.body) || req.body.length === 0) return reply.code(400).send({ error: 'Empty upload' })

  try {
    await storeAsset(id, req.body, contentType)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST') return reply.code(409).send({ error: 'Asset already exists' })
    throw error
  }
  return { ok: true }
})

app.get<{ Params: { id: string } }>('/uploads/:id', async (req, reply) => {
  // Served without auth so <img> tags can load them; ids are random and unguessable.
  const asset = ASSET_ID_PATTERN.test(req.params.id) ? await loadAsset(req.params.id) : null
  if (!asset) return reply.code(404).send({ error: 'Not found' })
  return reply
    .header('Content-Type', asset.contentType)
    .header('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'") // user SVGs can't run scripts
    .header('X-Content-Type-Options', 'nosniff')
    .header('Cache-Control', 'private, max-age=31536000, immutable')
    .send(asset.data)
})

// ── internal (backend → canvas) ──────────────────────────────────────────────

app.post<{ Params: { room: string }; Body: { userId?: string } }>('/internal/rooms/:room/:action', async (req, reply) => {
  if (req.headers['x-internal-token'] !== internalToken) return reply.code(401).send({ error: 'Unauthorized' })
  const { room, action } = req.params as { room: string; action: string }
  if (!ROOM_ID_PATTERN.test(room)) return reply.code(400).send({ error: 'Invalid room' })
  if (action === 'revoke') return { closed: revokeUser(room, String(req.body?.userId ?? '')) }
  if (action === 'close') {
    closeRoom(room)
    return { closed: true }
  }
  return reply.code(404).send({ error: 'Unknown action' })
})

const retention = () => {
  const deleted = deleteOldRooms(config.retentionDays)
  if (deleted) console.log(`[canvas] deleted ${deleted} whiteboard(s) older than ${config.retentionDays} days`)
}
retention()
setInterval(retention, 24 * 60 * 60 * 1000).unref()

const shutdown = async () => {
  closeAllRooms()
  await app.close()
  process.exit(0)
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

await app.listen({ port: config.port, host: config.host })
console.log(`[canvas] tldraw sync server listening on http://${config.host}:${config.port} (data in ${config.dataDir})`)
