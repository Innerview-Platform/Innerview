import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { AuthUser } from '@/features/auth/types'
import { getTokenExpiry, loadSession } from '@/features/auth/utils/session'

export type SessionEndReason = 'expired' | 'signed-out' | null

export interface AuthState {
  accessToken: string | null
  user: AuthUser | null
  expiresAt: number | null
  /** Why the last session ended; lets the UI explain a redirect to the login page. */
  sessionEndReason: SessionEndReason
}

function initialState(): AuthState {
  const session = loadSession()
  return {
    accessToken: session?.accessToken ?? null,
    user: session?.user ?? null,
    expiresAt: session?.expiresAt ?? null,
    sessionEndReason: null,
  }
}

const signedOut = (reason: SessionEndReason): AuthState => ({
  accessToken: null,
  user: null,
  expiresAt: null,
  sessionEndReason: reason,
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    sessionStarted(state, action: PayloadAction<{ accessToken: string; user: AuthUser }>) {
      const { accessToken, user } = action.payload
      state.accessToken = accessToken
      state.user = user
      // Fall back to the backend's configured 15-minute lifetime if the token has no exp claim.
      state.expiresAt = getTokenExpiry(accessToken) ?? Date.now() + 15 * 60_000
      state.sessionEndReason = null
    },
    loggedOut: () => signedOut('signed-out'),
    sessionExpired: (state) => (state.accessToken ? signedOut('expired') : state),
    /** Another tab changed the stored session. */
    sessionSynced: (_state, action: PayloadAction<AuthState>) => action.payload,
    sessionEndReasonCleared(state) {
      state.sessionEndReason = null
    },
  },
  selectors: {
    selectAccessToken: (state) => state.accessToken,
    selectCurrentUser: (state) => state.user,
    selectIsAuthenticated: (state) => Boolean(state.accessToken && state.user),
    selectSessionExpiresAt: (state) => state.expiresAt,
    selectSessionEndReason: (state) => state.sessionEndReason,
  },
})

export const { sessionStarted, loggedOut, sessionExpired, sessionSynced, sessionEndReasonCleared } = authSlice.actions
export const {
  selectAccessToken,
  selectCurrentUser,
  selectIsAuthenticated,
  selectSessionExpiresAt,
  selectSessionEndReason,
} = authSlice.selectors
export default authSlice
