import { useEffect, useState, type ReactNode } from 'react'
import { useAppSelector } from '@/app/hooks'
import { PageLoader } from '@/components/feedback/states'
import { selectIsAuthenticated } from '@/features/auth/slices/authSlice'
import { refreshSession } from '@/lib/axios'

/**
 * Restores the session before routing: without a stored access token (first visit after it expired,
 * or right after Google sign-in, which only sets the refresh cookie) try the refresh cookie once.
 */
export function AuthBootstrap({ children }: { children: ReactNode }) {
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const [ready, setReady] = useState(isAuthenticated)

  useEffect(() => {
    if (ready) return
    let cancelled = false
    refreshSession().finally(() => {
      if (!cancelled) setReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [ready])

  if (!ready) return <PageLoader label="Loading…" />
  return <>{children}</>
}
