import { existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { NodeSqliteWrapper, SQLiteSyncStorage, TLSocketRoom } from '@tldraw/sync-core'
import type { TLRecord } from '@tldraw/tlschema'
import Database from 'better-sqlite3'
import { config } from './config.ts'

export interface SessionMeta {
  userId: string
}

const ROOMS_DIR = join(config.dataDir, 'rooms')
mkdirSync(ROOMS_DIR, { recursive: true })

/** Interview room ids are short alphanumeric codes; anything else is rejected before touching disk. */
export const ROOM_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/

// There must only ever be one TLSocketRoom per room id, or users won't see each other's changes.
const rooms = new Map<string, TLSocketRoom<TLRecord, SessionMeta>>()

export function getOrCreateRoom(roomId: string): TLSocketRoom<TLRecord, SessionMeta> {
  const existing = rooms.get(roomId)
  if (existing && !existing.isClosed()) return existing

  // The document is persisted to SQLite as it changes, so a room survives restarts and
  // everyone leaving; the next participant to open the whiteboard gets the same drawing back.
  const db = new Database(join(ROOMS_DIR, `${roomId}.db`))
  db.pragma('journal_mode = WAL')
  const storage = new SQLiteSyncStorage<TLRecord>({ sql: new NodeSqliteWrapper(db) })

  const room = new TLSocketRoom<TLRecord, SessionMeta>({
    storage,
    onSessionRemoved(room, { numSessionsRemaining }) {
      if (numSessionsRemaining > 0) return
      console.log(`[canvas] room ${roomId} is empty, unloading`)
      room.close()
      db.close()
      rooms.delete(roomId)
    },
  })

  console.log(`[canvas] room ${roomId} loaded`)
  rooms.set(roomId, room)
  return room
}

const closedMarker = (roomId: string) => join(ROOMS_DIR, `${roomId}.closed`)

/** The interview ended: disconnect everyone; later connections are read-only (summary page). */
export function closeRoom(roomId: string) {
  writeFileSync(closedMarker(roomId), new Date().toISOString())
  const room = rooms.get(roomId)
  if (!room) return
  for (const session of room.getSessions()) room.closeSession(session.sessionId)
}

export function isRoomClosed(roomId: string) {
  return existsSync(closedMarker(roomId))
}

/** Disconnects one user (removed from the interview, or their permissions changed). */
export function revokeUser(roomId: string, userId: string): number {
  const room = rooms.get(roomId)
  if (!room) return 0
  let closed = 0
  for (const session of room.getSessions()) {
    if (session.meta.userId === userId) {
      room.closeSession(session.sessionId)
      closed++
    }
  }
  return closed
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
