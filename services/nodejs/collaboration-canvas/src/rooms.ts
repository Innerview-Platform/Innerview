import { existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import Database from 'better-sqlite3'
import WebSocket from 'ws'
import { config } from './config.ts'
import { isRecord, isScene, MAX_SCENE_BYTES, mergeScene, type Scene } from './scene.ts'

const ROOMS_DIR = join(config.dataDir, 'rooms')
mkdirSync(ROOMS_DIR, { recursive: true })

/** Interview room ids are short alphanumeric codes; anything else is rejected before touching disk. */
export const ROOM_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/

interface Session {
  socket: WebSocket
  userId: string
  name: string
  readonly: boolean
}

interface ConnectedSession extends Session {
  sessionId: string
  pointer?: { x: number; y: number }
  button?: 'up' | 'down'
  selectedElementIds?: Record<string, boolean>
}

/** One persisted Excalidraw scene and its live room sockets. */
export class CanvasRoom {
  private readonly db: Database.Database
  private readonly sessions = new Set<ConnectedSession>()
  private scene: Scene = { elements: [], files: {} }
  private closed = false

  constructor(readonly roomId: string, private readonly onEmpty: () => void) {
    this.db = new Database(join(ROOMS_DIR, `${roomId}.db`))
    this.db.pragma('journal_mode = WAL')
    this.db.exec('CREATE TABLE IF NOT EXISTS excalidraw_scene (id INTEGER PRIMARY KEY CHECK (id = 1), data TEXT NOT NULL)')
    const stored = this.db.prepare('SELECT data FROM excalidraw_scene WHERE id = 1').get() as { data: string } | undefined
    if (stored) {
      try {
        const parsed: unknown = JSON.parse(stored.data)
        if (!isScene(parsed)) throw new Error('Invalid scene')
        this.scene = parsed
      } catch {
        console.warn(`[canvas] ignored invalid stored scene for room ${roomId}`)
      }
    }
  }

  connect(input: Session) {
    const session: ConnectedSession = { ...input, sessionId: randomUUID() }
    this.sessions.add(session)
    this.send(session.socket, { type: 'scene', scene: this.scene, readonly: session.readonly, sessionId: session.sessionId })
    this.broadcastPresence()
    session.socket.on('message', (raw, isBinary) => {
      if (isBinary || this.closed || session.socket.readyState !== WebSocket.OPEN) return
      let message: unknown
      try {
        message = JSON.parse(raw.toString())
      } catch {
        return
      }
      if (!isRecord(message)) return
      if (message.type === 'presence') {
        if (!isRecord(message.pointer) || !Number.isFinite(message.pointer.x) || !Number.isFinite(message.pointer.y)) return
        session.pointer = { x: Number(message.pointer.x), y: Number(message.pointer.y) }
        session.button = message.button === 'down' ? 'down' : 'up'
        if (isRecord(message.selectedElementIds)) {
          session.selectedElementIds = Object.fromEntries(Object.entries(message.selectedElementIds)
            .filter(([, selected]) => selected === true).slice(0, 1000)) as Record<string, boolean>
        }
        this.broadcastPresence()
        return
      }
      if (session.readonly || isRoomClosed(this.roomId) || message.type !== 'scene' || !isScene(message.scene)) return
      const next = mergeScene(this.scene, message.scene)
      const data = JSON.stringify(next)
      if (Buffer.byteLength(data) > MAX_SCENE_BYTES - 1024) {
        this.send(session.socket, { type: 'error', message: 'This whiteboard is too large to sync. Remove large images and try again.' })
        return
      }
      if (data === JSON.stringify(this.scene)) {
        this.send(session.socket, { type: 'scene', scene: { elements: this.scene.elements, files: {} } })
        return
      }
      const changedFiles = Object.fromEntries(Object.entries(next.files)
        .filter(([id, file]) => JSON.stringify(file) !== JSON.stringify(this.scene.files[id])))
      this.db.prepare('INSERT INTO excalidraw_scene (id, data) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data')
        .run(data)
      this.scene = next
      this.broadcast({ type: 'scene', scene: { elements: this.scene.elements, files: changedFiles } })
    })
    session.socket.on('close', () => {
      this.sessions.delete(session)
      if (!this.closed) this.broadcastPresence()
      if (this.sessions.size === 0 && !this.closed) this.onEmpty()
    })
  }

  disconnectUser(userId: string): number {
    let disconnected = 0
    for (const session of this.sessions) {
      if (session.userId !== userId) continue
      session.readonly = true
      session.socket.close(4403, 'FORBIDDEN')
      disconnected++
    }
    return disconnected
  }

  close() {
    if (this.closed) return
    this.closed = true
    for (const session of this.sessions) session.socket.close(1001, 'Room closed')
    this.db.close()
  }

  private broadcastPresence() {
    this.broadcast({ type: 'presence', peers: [...this.sessions].map(({ socket: _socket, readonly: _readonly, ...peer }) => peer) })
  }

  private broadcast(message: unknown) {
    const data = JSON.stringify(message)
    for (const { socket } of this.sessions) {
      if (socket.readyState === WebSocket.OPEN) socket.send(data)
    }
  }

  private send(socket: WebSocket, message: unknown) {
    if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message))
  }
}

const rooms = new Map<string, CanvasRoom>()

export function getOrCreateRoom(roomId: string): CanvasRoom {
  const existing = rooms.get(roomId)
  if (existing) return existing
  let room: CanvasRoom
  room = new CanvasRoom(roomId, () => {
    console.log(`[canvas] room ${roomId} is empty, unloading`)
    room.close()
    rooms.delete(roomId)
  })
  rooms.set(roomId, room)
  console.log(`[canvas] room ${roomId} loaded`)
  return room
}

const closedMarker = (roomId: string) => join(ROOMS_DIR, `${roomId}.closed`)

/** The interview ended: disconnect everyone; later connections are read-only (summary page). */
export function closeRoom(roomId: string) {
  writeFileSync(closedMarker(roomId), new Date().toISOString())
  const room = rooms.get(roomId)
  if (room) room.close()
  rooms.delete(roomId)
}

export function isRoomClosed(roomId: string) {
  return existsSync(closedMarker(roomId))
}

/** Disconnects one user (removed from the interview, or their permissions changed). */
export function revokeUser(roomId: string, userId: string): number {
  return rooms.get(roomId)?.disconnectUser(userId) ?? 0
}

/** Deletes whiteboards of interviews that ended more than `days` ago (never ones that are open). */
export function deleteOldRooms(days: number): number {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  let deleted = 0
  for (const file of readdirSync(ROOMS_DIR)) {
    if (!file.endsWith('.closed')) continue
    const roomId = file.slice(0, -'.closed'.length)
    if (rooms.has(roomId) || statSync(join(ROOMS_DIR, file)).mtimeMs > cutoff) continue
    for (const suffix of ['.db', '.db-wal', '.db-shm', '.closed']) rmSync(join(ROOMS_DIR, roomId + suffix), { force: true })
    deleted++
  }
  return deleted
}

export function closeAllRooms() {
  for (const room of rooms.values()) room.close()
  rooms.clear()
}

export function activeRoomCount() {
  return rooms.size
}
