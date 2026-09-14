import axios, { isAxiosError, type InternalAxiosRequestConfig } from 'axios'
import type { EnhancedStore } from '@reduxjs/toolkit'
import { config } from '@/constants/config'
import { toApiError } from '@/lib/apiError'
import { sessionExpired, type AuthState } from '@/features/auth/slices/authSlice'

type AuthAwareStore = EnhancedStore<{ auth: AuthState }>

let store: AuthAwareStore | null = null

/** Called once by the store module so the client can read the token without a circular import. */
export function injectStore(appStore: AuthAwareStore) {
  store = appStore
}

export const apiClient = axios.create({
  baseURL: config.apiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
  // The refresh_token cookie (Path=/api/auth) must accompany logout.
  withCredentials: true,
  timeout: 20_000,
})

apiClient.interceptors.request.use((request: InternalAxiosRequestConfig) => {
  const token = store?.getState().auth.accessToken
  if (token && !request.headers.has('Authorization')) {
    request.headers.set('Authorization', `Bearer ${token}`)
  }
  return request
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const apiError = toApiError(error)
    const sentToken = isAxiosError(error) && Boolean(error.config?.headers?.has('Authorization'))

    // A 401 on an authenticated request means the access token is no longer accepted.
    // The backend offers no usable refresh flow for browsers (see README), so end the session.
    if (apiError.status === 401 && sentToken && store?.getState().auth.accessToken) {
      store.dispatch(sessionExpired())
    }
    return Promise.reject(apiError)
  },
)
