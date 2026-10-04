/**
 * InnerView shared whiteboard — a self-hosted Excalidraw scene sync server.
 *
 *   WS   /connect/:roomId?token=…                multiplayer sync for one room (token = room ticket)
 *   GET  /health
 *   POST /internal/rooms/:room/revoke|close       backend only (X-Internal-Token)
 */
import cors from '@fastify/cors'
import websocketPlugin from '@fastify/websocket'
import fastify, { LogController } from 'fastify'
import { internalToken, verifyTicket } from './auth.ts'
import { config } from './config.ts'
import { redis } from './store.ts'
import { activeRoomCount, closeAllRooms, closeRoom, deleteOldRooms, getOrCreateRoom, revokeUser, ROOM_ID_PATTERN } from './rooms.ts'

// Request logging is off because sync URLs carry the access token in their query string.
const app = fastify({
  logger: { level: 'warn' },
  logController: new LogController({ disableRequestLogging: true }),
})

await app.register(websocketPlugin, { options: { maxPayload: 8 * 1024 * 1024 } })
await app.register(cors, { origin: config.corsOrigins, methods: ['GET', 'PUT'] })

await redis.connect()

app.get('/health', async () => {
  await redis.ping()
  return { status: 'UP', rooms: activeRoomCount() }
})

app.get<{ Params: { roomId: string }; Querystring: { token?: string } }>(
  '/connect/:roomId',
  { websocket: true },
  async (socket, req) => {
    const { roomId } = req.params
    const { token } = req.query
    const ticket = await verifyTicket(token)

    if (!ticket) {
      socket.close(4401, 'NOT_AUTHENTICATED')
      return
    }
    if (!ROOM_ID_PATTERN.test(roomId)) {
      socket.close(4404, 'NOT_FOUND')
      return
    }
    if (ticket.room !== roomId) {
      socket.close(4403, 'FORBIDDEN')
      return
    }

    // Observers, review tickets and ended interviews see the board but can't change it.
    try {
      const room = await getOrCreateRoom(roomId)
      room.connect({ socket, userId: ticket.userId, readonly: ticket.readonly })
      console.log(`[canvas] user ${ticket.userId} joined room ${roomId}`)
    } catch (error) {
      console.error(`[canvas] failed to load room ${roomId}`, error)
      socket.close(1011, 'Storage unavailable')
    }
  },
)

// ── internal (backend → canvas) ──────────────────────────────────────────────

app.post<{ Params: { room: string }; Body: { userId?: string } }>('/internal/rooms/:room/:action', async (req, reply) => {
  if (req.headers['x-internal-token'] !== internalToken) return reply.code(401).send({ error: 'Unauthorized' })
  const { room, action } = req.params as { room: string; action: string }
  if (!ROOM_ID_PATTERN.test(room)) return reply.code(400).send({ error: 'Invalid room' })
  if (action === 'revoke') return { closed: await revokeUser(room, String(req.body?.userId ?? '')) }
  if (action === 'close') {
    await closeRoom(room)
    return { closed: true }
  }
  return reply.code(404).send({ error: 'Unknown action' })
})

const retention = async () => {
  const deleted = await deleteOldRooms(config.retentionDays)
  if (deleted) console.log(`[canvas] deleted ${deleted} whiteboard(s) older than ${config.retentionDays} days`)
}
await retention()
const retentionTimer = setInterval(() => {
  void retention().catch((error) => console.error('[canvas] retention failed', error))
}, 24 * 60 * 60 * 1000).unref()

const shutdown = async () => {
  clearInterval(retentionTimer)
  await closeAllRooms()
  await app.close()
  await redis.quit()
  process.exit(0)
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

await app.listen({ port: config.port, host: config.host })
console.log(`[canvas] Excalidraw sync server listening on http://${config.host}:${config.port} (Redis persistence)`)
