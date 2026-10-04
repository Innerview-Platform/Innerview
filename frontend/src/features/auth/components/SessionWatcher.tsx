import { useEffect } from 'react'
import { toast } from 'sonner'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import {
  selectSessionEndReason,
  selectSessionExpiresAt,
  sessionEndReasonCleared,
  sessionExpired,
  sessionSynced,
} from '@/features/auth/slices/authSlice'
import { loadSession, SESSION_STORAGE_KEY } from '@/features/auth/utils/session'
import { refreshSession } from '@/lib/axios'

/** Refresh this long before the access token expires. */
const REFRESH_LEAD_MS = 60_000
// setTimeout delays above 2^31-1 ms overflow and fire immediately.
const MAX_TIMEOUT_MS = 2_147_483_647

/**
 * Keeps the session alive: silently refreshes the short-lived access token a minute before it
 * expires (using the httpOnly refresh cookie), ends the session only if refreshing fails, and syncs
 * sign-in/out across tabs.
 */
export function SessionWatcher() {
  const dispatch = useAppDispatch()
  const expiresAt = useAppSelector(selectSessionExpiresAt)
  const endReason = useAppSelector(selectSessionEndReason)

  useEffect(() => {
    if (!expiresAt) return
    const timer = setTimeout(
      async () => {
        if (await refreshSession()) return
        // Refresh failed (signed out elsewhere, refresh token expired): end at expiry.
        const remaining = expiresAt - Date.now()
        if (remaining <= 0) dispatch(sessionExpired())
        else setTimeout(() => dispatch(sessionExpired()), Math.min(remaining, MAX_TIMEOUT_MS))
      },
      Math.max(0, Math.min(expiresAt - Date.now() - REFRESH_LEAD_MS, MAX_TIMEOUT_MS)),
    )
    return () => clearTimeout(timer)
  }, [expiresAt, dispatch])

  useEffect(() => {
    if (endReason !== 'expired') return
    toast.error('Your session has expired', { description: 'Please sign in again to continue.' })
    dispatch(sessionEndReasonCleared())
  }, [endReason, dispatch])

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== SESSION_STORAGE_KEY) return
      const session = loadSession()
      dispatch(
        sessionSynced({
          accessToken: session?.accessToken ?? null,
          user: session?.user ?? null,
          expiresAt: session?.expiresAt ?? null,
          sessionEndReason: null,
        }),
      )
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [dispatch])

  return null
}
