import { createHmac } from 'node:crypto'
import { jwtVerify } from 'jose'
import { config } from './config.ts'

/** Room tickets are signed with HMAC-SHA256(JWT_SECRET, label) — see the backend's RoomTicketService. */
const ticketKey = createHmac('sha256', config.jwtSecret).update('innerview-room-ticket').digest()
export const internalToken = createHmac('sha256', config.jwtSecret).update('innerview-internal').digest('hex')

export interface Ticket {
  userId: string
  room: string
  name: string
  readonly: boolean
}

/** Verifies a room ticket issued by the backend; null when missing, invalid or expired. */
export async function verifyTicket(token: string | undefined | null): Promise<Ticket | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, ticketKey, { algorithms: ['HS256'] })
    if (payload.typ !== 'room' || typeof payload.sub !== 'string' || typeof payload.room !== 'string') return null
    return { userId: payload.sub, room: payload.room, name: String(payload.name ?? ''), readonly: payload.readonly === true }
  } catch {
    return null
  }
}

export function bearerToken(header: string | undefined): string | null {
  return header?.startsWith('Bearer ') ? header.slice(7) : null
}
