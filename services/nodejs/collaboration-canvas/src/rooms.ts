import { existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import Database from 'better-sqlite3'
import WebSocket from 'ws'
import { config } from './config.ts'

const ROOMS_DIR = join(config.dataDir, 'rooms')
mkdirSync(ROOMS_DIR, { recursive: true })

/** Interview room ids are short alphanumeric codes; anything else is rejected before touching disk. */
export const ROOM_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/

export interface Scene {
  elements: unknown[]
  files: Record<string, unknown>
}

interface Session {
  socket: WebSocket
  userId: string
  readonly: boolean
}

function mergeScene(current: Scene, incoming: Scene): Scene {
  const elements = new Map(current.elements.map((element) => [(element as { id?: string }).id, element]))
  for (const element of incoming.elements) {
    const id = (element as { id?: string }).id
    if (!id) continue
    const previous = elements.get(id) as { version?: number; versionNonce?: number } | undefined
    const next = element as { version?: number; versionNonce?: number }
    if (!previous || (next.version ?? 0) > (previous.version ?? 0) ||
      ((next.version ?? 0) === (previous.version ?? 0) && (next.versionNonce ?? 0) > (previous.versionNonce ?? 0))) {
      elements.set(id, element)
    }
  }
  return { elements: [...elements.values()], files: { ...current.files, ...incoming.files } }
}

/** One persisted Excalidraw scene and its live room sockets. */
export class CanvasRoom {
  private readonly db: Database.Database
  private readonly sessions = new Set<Session>()
  private scene: Scene = { elements: [], files: {} }
  private closed = false

  constructor(readonly roomId: string, private readonly onEmpty: () => void) {
    this.db = new Database(join(ROOMS_DIR, `${roomId}.db`))
    this.db.pragma('journal_mode = WAL')
    this.db.exec('CREATE TABLE IF NOT EXISTS excalidraw_scene (id INTEGER PRIMARY KEY CHECK (id = 1), data TEXT NOT NULL)')
    const stored = this.db.prepare('SELECT data FROM excalidraw_scene WHERE id = 1').get() as { data: string } | undefined
    if (stored) {
      try {
        const parsed = JSON.parse(stored.data) as Partial<Scene>
        if (Array.isArray(parsed.elements) && parsed.files && typeof parsed.files === 'object') {
          this.scene = { elements: parsed.elements, files: parsed.files as Record<string, unknown> }
        }
      } catch {
        console.warn(`[canvas] ignored invalid stored scene for room ${roomId}`)
      }
    }
  }

  connect(session: Session) {
    this.sessions.add(session)
    this.send(session.socket, { type: 'scene', scene: this.scene })
    session.socket.on('message', (raw, isBinary) => {
      if (isBinary || session.readonly || isRoomClosed(this.roomId)) return
      let message: { type?: unknown; scene?: Partial<Scene> }
      try {
        message = JSON.parse(raw.toString()) as typeof message
      } catch {
        return
      }
      if (message.type !== 'scene' || !Array.isArray(message.scene?.elements) || !message.scene.files || typeof message.scene.files !== 'object') return

      this.scene = mergeScene(this.scene, {
        elements: message.scene.elements,
        files: message.scene.files as Record<string, unknown>,
      })
      this.db.prepare('INSERT INTO excalidraw_scene (id, data) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data')
        .run(JSON.stringify(this.scene))
      this.broadcast({ type: 'scene', scene: this.scene })
    })
    session.socket.on('close', () => {
      this.sessions.delete(session)
      if (this.sessions.size === 0 && !this.closed) this.onEmpty()
    })
  }

  disconnectUser(userId: string): number {
    let disconnected = 0
    for (const session of this.sessions) {
      if (session.userId !== userId) continue
      session.socket.close(1008, 'FORBIDDEN')
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

  get sessionCount() {
    return this.sessions.size
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
