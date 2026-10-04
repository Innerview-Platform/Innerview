import axios, { isAxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'
import type { EnhancedStore } from '@reduxjs/toolkit'
import { config } from '@/constants/config'
import { toApiError } from '@/lib/apiError'
import { sessionExpired, sessionStarted, type AuthState } from '@/features/auth/slices/authSlice'
import { loadSession } from '@/features/auth/utils/session'

type AuthAwareStore = EnhancedStore<{ auth: AuthState }>

let store: AuthAwareStore | null = null

/** Called once by the store module so the client can read the token without a circular import. */
export function injectStore(appStore: AuthAwareStore) {
  store = appStore
}

export const apiClient = axios.create({
  baseURL: config.apiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
  // The httpOnly refresh_token cookie (Path=/api/auth) must accompany refresh and logout.
  withCredentials: true,
  timeout: 20_000,
})

interface RetriableConfig extends AxiosRequestConfig {
  _retried?: boolean
  /** Requests that must not trigger a refresh (the refresh call itself, login…). */
  skipAuthRefresh?: boolean
}

apiClient.interceptors.request.use((request: InternalAxiosRequestConfig) => {
  const token = store?.getState().auth.accessToken
  if (token && !request.headers.has('Authorization')) {
    request.headers.set('Authorization', `Bearer ${token}`)
  }
  return request
})

// ── Session refresh ──────────────────────────────────────────────────────────

interface RefreshResponse {
  id: string
  email: string
  name?: string
  accessToken: string
}

let inflight: Promise<boolean> | null = null

/**
 * Exchanges the httpOnly refresh cookie for a new access token. One refresh at a time per tab, and
 * across tabs (Web Locks): refresh tokens rotate, so a second tab adopts the token the first one
 * stored instead of spending its now-revoked refresh token.
 */
export function refreshSession(): Promise<boolean> {
  inflight ??= refreshWithLock().finally(() => {
    inflight = null
  })
  return inflight
}

async function refreshWithLock(): Promise<boolean> {
  const run = async () => {
    const current = store?.getState().auth.accessToken ?? null
    const stored = loadSession()
    if (stored && stored.accessToken !== current && stored.expiresAt - Date.now() > 60_000) {
      store?.dispatch(sessionStarted({ accessToken: stored.accessToken, user: stored.user }))
      return true
    }
    try {
      const { data } = await apiClient.post<RefreshResponse>('/api/auth/refresh', null, {
        skipAuthRefresh: true,
        headers: { Authorization: '' },
      } as RetriableConfig)
      store?.dispatch(sessionStarted({ accessToken: data.accessToken, user: { id: data.id, email: data.email } }))
      return true
    } catch {
      return false
    }
  }
  return typeof navigator !== 'undefined' && navigator.locks ? navigator.locks.request('innerview-session-refresh', run) : run()
}

/** A valid access token, refreshed first when it's about to expire (for sockets and other clients). */
export async function getFreshAccessToken(): Promise<string | null> {
  const auth = store?.getState().auth
  if (auth?.accessToken && auth.expiresAt && auth.expiresAt - Date.now() > 30_000) return auth.accessToken
  return (await refreshSession()) ? (store?.getState().auth.accessToken ?? null) : null
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = (isAxiosError(error) ? error.config : undefined) as RetriableConfig | undefined
    const status = isAxiosError(error) ? error.response?.status : undefined
    const sentToken = Boolean(request?.headers && (request.headers as Record<string, unknown>)['Authorization'])

    // An expired access token: refresh once and replay the request.
    if (status === 401 && request && sentToken && !request._retried && !request.skipAuthRefresh && store?.getState().auth.accessToken) {
      request._retried = true
      if (await refreshSession()) {
        const token = store.getState().auth.accessToken
        request.headers = { ...(request.headers as Record<string, string>), Authorization: `Bearer ${token}` }
        return apiClient.request(request)
      }
      store.dispatch(sessionExpired())
    }
    return Promise.reject(toApiError(error))
  },
)
