import { jwtVerify } from 'jose'
import { config } from './config.ts'

export interface Ticket {
  userId: string
  room: string
  role: string
  name: string
  /** Host or interviewer: may open the private interviewer notes. */
  staff: boolean
  host: boolean
  readonly: boolean
}

/** Verifies a room ticket issued by the backend; null when invalid or expired. */
export async function verifyTicket(token: string | null | undefined): Promise<Ticket | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, config.ticketKey, { algorithms: ['HS256'] })
    if (payload.typ !== 'room' || typeof payload.sub !== 'string' || typeof payload.room !== 'string') return null
    return {
      userId: payload.sub,
      room: payload.room,
      role: String(payload.role ?? ''),
      name: String(payload.name ?? ''),
      staff: payload.staff === true,
      host: payload.host === true,
      readonly: payload.readonly === true,
    }
  } catch {
    return null
  }
}
