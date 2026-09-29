import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import Database from 'better-sqlite3'
import { config } from './config.ts'

mkdirSync(config.dataDir, { recursive: true })

const db = new Database(join(config.dataDir, 'documents.db'))
db.pragma('journal_mode = WAL')
db.exec(`
  CREATE TABLE IF NOT EXISTS documents (
    name TEXT PRIMARY KEY,
    data BLOB NOT NULL,
    updated_at INTEGER NOT NULL
  );
  -- Every update to a room's code document, in order: the interview replay timeline.
  CREATE TABLE IF NOT EXISTS updates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    at INTEGER NOT NULL,
    data BLOB NOT NULL
  );
  CREATE INDEX IF NOT EXISTS updates_by_name ON updates (name, id);
  -- Rooms whose interview ended: documents become read-only.
  CREATE TABLE IF NOT EXISTS closed_rooms (
    room TEXT PRIMARY KEY,
    closed_at INTEGER NOT NULL
  );
`)

const selectDocument = db.prepare<[string], { data: Buffer }>('SELECT data FROM documents WHERE name = ?')
const upsertDocument = db.prepare<[string, Buffer, number]>(
  'INSERT INTO documents (name, data, updated_at) VALUES (?, ?, ?) ON CONFLICT(name) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at',
)
const insertUpdate = db.prepare<[string, number, Buffer]>('INSERT INTO updates (name, at, data) VALUES (?, ?, ?)')
const selectUpdates = db.prepare<[string], { at: number; data: Buffer }>('SELECT at, data FROM updates WHERE name = ? ORDER BY id')
const insertClosed = db.prepare<[string, number]>('INSERT OR IGNORE INTO closed_rooms (room, closed_at) VALUES (?, ?)')
const selectClosed = db.prepare<[string], { room: string }>('SELECT room FROM closed_rooms WHERE room = ?')

export const store = {
  load: (name: string): Uint8Array | null => selectDocument.get(name)?.data ?? null,
  save: (name: string, state: Uint8Array) => upsertDocument.run(name, Buffer.from(state), Date.now()),
  appendUpdate: (name: string, update: Uint8Array) => insertUpdate.run(name, Date.now(), Buffer.from(update)),
  updates: (name: string) => selectUpdates.all(name),
  closeRoom: (room: string) => insertClosed.run(room, Date.now()),
  isClosed: (room: string) => Boolean(selectClosed.get(room)),
  close: () => db.close(),
}
