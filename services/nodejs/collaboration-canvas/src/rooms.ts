import WebSocket from 'ws'
import { store } from './store.ts'

/** Interview room ids are short alphanumeric codes; anything else is rejected before accessing storage. */
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
  private pending: Promise<void> = Promise.resolve()
  private ended = false
  closing = false
  private readonly sessions = new Set<Session>()
  private scene: Scene = { elements: [], files: {} }
  private closed = false

  constructor(readonly roomId: string, private readonly onEmpty: () => void) {
  }

  async load() {
    const stored = await store.load(this.roomId)
    this.ended = stored.closed
    if (stored.scene) {
      const parsed = JSON.parse(stored.scene) as Partial<Scene>
      if (!Array.isArray(parsed.elements) || !parsed.files || typeof parsed.files !== 'object') {
        throw new Error(`Invalid stored scene for room ${this.roomId}`)
      }
      this.scene = { elements: parsed.elements, files: parsed.files }
    }
  }

  end() {
    this.closing = true
    this.ended = true
  }

  connect(session: Session) {
    if (this.closed) {
      session.socket.close(1011, 'Room reloading')
      return
    }
    if (socketClosed(session.socket)) {
      if (this.sessions.size === 0) this.onEmpty()
      return
    }
    this.sessions.add(session)
    this.send(session.socket, { type: 'scene', scene: this.scene })
    session.socket.on('message', (raw, isBinary) => {
      if (isBinary || session.readonly || this.ended || this.closed) return
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
      const scene = JSON.stringify(this.scene)
      this.pending = this.pending.then(async () => {
        await store.save(this.roomId, scene)
        this.broadcast({ type: 'scene', scene: JSON.parse(scene) })
      }).catch((error) => {
        console.error(`[canvas] failed to persist room ${this.roomId}`, error)
        this.closed = true
        for (const { socket } of this.sessions) socket.close(1011, 'Storage unavailable')
      })
    })
    session.socket.on('close', () => {
      this.sessions.delete(session)
      if (this.sessions.size === 0) this.onEmpty()
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

  async flush() {
    let pending: Promise<void>
    do {
      pending = this.pending
      await pending
    } while (pending !== this.pending)
  }

  async close() {
    this.closed = true
    for (const session of this.sessions) session.socket.close(1001, 'Room closed')
    await this.pending
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

function socketClosed(socket: WebSocket) {
  return socket.readyState !== WebSocket.OPEN
}

// Share room loads and keep idle rooms until pending writes finish.
const rooms = new Map<string, Promise<CanvasRoom>>()

export function getOrCreateRoom(roomId: string): Promise<CanvasRoom> {
  const existing = rooms.get(roomId)
  if (existing) return existing
  const room = new CanvasRoom(roomId, () => {
    void room.flush().then(() => {
      if (room.sessionCount === 0 && !room.closing && rooms.get(roomId) === loading) rooms.delete(roomId)
    })
  })
  const loading = room.load().then(() => room).catch((error) => {
    rooms.delete(roomId)
    throw error
  })
  rooms.set(roomId, loading)
  return loading
}

/** The interview ended: disconnect everyone; later connections are read-only. */
export async function closeRoom(roomId: string) {
  const room = await getOrCreateRoom(roomId)
  room.end()
  const current = rooms.get(roomId)
  await store.closeRoom(roomId)
  await room.close()
  if (rooms.get(roomId) === current) rooms.delete(roomId)
}

export async function revokeUser(roomId: string, userId: string): Promise<number> {
  return (await rooms.get(roomId))?.disconnectUser(userId) ?? 0
}

export async function deleteOldRooms(days: number): Promise<number> {
  return store.deleteOldRooms(days, (roomId) => rooms.has(roomId))
}

export async function closeAllRooms() {
  await Promise.all([...rooms.values()].map(async (room) => (await room).close()))
  rooms.clear()
}

export function activeRoomCount() {
  return rooms.size
}
