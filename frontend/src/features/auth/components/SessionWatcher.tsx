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

const WARNING_LEAD_MS = 2 * 60_000
// setTimeout delays above 2^31-1 ms overflow and fire immediately.
const MAX_TIMEOUT_MS = 2_147_483_647

/**
 * Keeps the client session consistent with the backend's short-lived access tokens:
 * warns before expiry, ends the session at expiry, and syncs sign-in/out across tabs.
 */
export function SessionWatcher() {
  const dispatch = useAppDispatch()
  const expiresAt = useAppSelector(selectSessionExpiresAt)
  const endReason = useAppSelector(selectSessionEndReason)

  useEffect(() => {
    if (!expiresAt) return
    const remaining = expiresAt - Date.now()
    if (remaining <= 0) {
      dispatch(sessionExpired())
      return
    }
    const timers: ReturnType<typeof setTimeout>[] = []
    if (remaining > WARNING_LEAD_MS) {
      timers.push(
        setTimeout(
          () => toast.warning('Your session expires in 2 minutes', { description: 'Save your work — you will need to sign in again.' }),
          Math.min(remaining - WARNING_LEAD_MS, MAX_TIMEOUT_MS),
        ),
      )
    }
    timers.push(setTimeout(() => dispatch(sessionExpired()), Math.min(remaining, MAX_TIMEOUT_MS)))
    return () => timers.forEach(clearTimeout)
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
