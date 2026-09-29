import { createHmac } from 'node:crypto'
import { resolve } from 'node:path'

function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required environment variable ${name}`)
  return value
}

const jwtSecret = required('JWT_SECRET')

export const config = {
  port: Number(process.env.PORT ?? process.env.EDITOR_PORT ?? 1234),
  host: process.env.EDITOR_HOST ?? '0.0.0.0',
  dataDir: resolve(process.env.EDITOR_DATA_DIR ?? './data'),
  /** Backend base URL for document snapshots (POST /api/internal/documents). */
  backendUrl: (process.env.BACKEND_INTERNAL_URL ?? 'http://localhost:8080').replace(/\/+$/, ''),
  /** Room tickets are signed with HMAC-SHA256(JWT_SECRET, label) — see the backend's RoomTicketService. */
  ticketKey: createHmac('sha256', jwtSecret).update('innerview-room-ticket').digest(),
  internalToken: createHmac('sha256', jwtSecret).update('innerview-internal').digest('hex'),
}
