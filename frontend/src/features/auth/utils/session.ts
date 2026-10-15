import type { AuthUser } from '@/features/auth/types'

const STORAGE_KEY = 'innerview.session'
/**
 * Set whenever this browser has held a session; cleared on sign-out and when a session expires. Lets
 * first-time visitors skip the refresh call (always a 401 for them) before the first render.
 */
const HINT_KEY = 'innerview.hasSession'

export interface StoredSession {
  accessToken: string
  user: AuthUser
  /** Epoch milliseconds taken from the JWT `exp` claim. */
  expiresAt: number
}

interface JwtPayload {
  sub?: string
  exp?: number
}

/** Decodes (without verifying) the payload of a JWT. The backend signs tokens; we only read `sub` and `exp`. */
function decodeJwt(token: string): JwtPayload | null {
  try {
    const [, payload] = token.split('.')
    if (!payload) return null
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(payload.length / 4) * 4, '='))
    return JSON.parse(json) as JwtPayload
  } catch {
    return null
  }
}

export function getTokenExpiry(token: string): number | null {
  const exp = decodeJwt(token)?.exp
  return typeof exp === 'number' ? exp * 1000 : null
}

function isSessionValid(session: Pick<StoredSession, 'expiresAt'> | null, now = Date.now()): boolean {
  return Boolean(session && session.expiresAt > now)
}

export function loadSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const session = JSON.parse(raw) as StoredSession
    if (!session.accessToken || !session.user?.id || !isSessionValid(session)) {
      localStorage.removeItem(STORAGE_KEY)
      // The access token expired, but the refresh cookie may still be good.
      localStorage.setItem(HINT_KEY, '1')
      return null
    }
    return session
  } catch {
    return null
  }
}

export function saveSession(session: StoredSession) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    localStorage.setItem(HINT_KEY, '1')
  } catch {
    // Storage can be unavailable (private mode, quota); the session still works for this tab.
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(HINT_KEY)
  } catch {
    // ignore
  }
}

/** False only when this browser has never had a session (so there can't be a refresh cookie worth trying). */
export function mayHaveSession(): boolean {
  try {
    return localStorage.getItem(HINT_KEY) !== null || localStorage.getItem(STORAGE_KEY) !== null
  } catch {
    return true
  }
}

export const SESSION_STORAGE_KEY = STORAGE_KEY
