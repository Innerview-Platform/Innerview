import type { AuthUser } from '@/features/auth/types'

const STORAGE_KEY = 'innerview.session'

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
export function decodeJwt(token: string): JwtPayload | null {
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

export function isSessionValid(session: Pick<StoredSession, 'expiresAt'> | null, now = Date.now()): boolean {
  return Boolean(session && session.expiresAt > now)
}

export function loadSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const session = JSON.parse(raw) as StoredSession
    if (!session.accessToken || !session.user?.id || !isSessionValid(session)) {
      localStorage.removeItem(STORAGE_KEY)
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
  } catch {
    // Storage can be unavailable (private mode, quota); the session still works for this tab.
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

export const SESSION_STORAGE_KEY = STORAGE_KEY
