import { useEffect, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { useAppSelector } from '@/app/hooks'
import { PageLoader } from '@/components/feedback/states'
import { OAUTH_RETURN_KEY } from '@/features/auth/components/GoogleSignIn'
import { selectIsAuthenticated } from '@/features/auth/slices/authSlice'
import { mayHaveSession } from '@/features/auth/utils/session'
import { refreshSession } from '@/lib/axios'

/** The backend sends Google sign-ins back to `/?signin=google` with only the refresh cookie set. */
export function isGoogleReturn() {
  return new URLSearchParams(window.location.search).get('signin') === 'google'
}

/** Drops `?signin=google` (and goes where the user was headed) before the router reads the URL. */
function finishGoogleReturn(signedIn: boolean) {
  let returnTo: string | null = null
  try {
    returnTo = sessionStorage.getItem(OAUTH_RETURN_KEY)
    sessionStorage.removeItem(OAUTH_RETURN_KEY)
  } catch {
    // ignore
  }
  const url = new URL(window.location.href)
  url.searchParams.delete('signin')
  const target = signedIn && returnTo?.startsWith('/') ? returnTo : `${url.pathname}${url.search}${url.hash}`
  window.history.replaceState(window.history.state, '', target)
  if (!signedIn) toast.error("Google sign-in didn't complete", { description: 'Please try again, or sign in with your email.' })
}

/**
 * Restores the session before routing: without a stored access token (first visit after it expired,
 * or right after Google sign-in, which only sets the refresh cookie) try the refresh cookie once.
 * A browser that has never had a session renders straight away (no refresh call to wait for).
 */
export function AuthBootstrap({ children }: { children: ReactNode }) {
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  // The build-time prerender (no window) renders the signed-out pages.
  const [ready, setReady] = useState(
    () => typeof window === 'undefined' || (!isGoogleReturn() && (isAuthenticated || !mayHaveSession())),
  )

  useEffect(() => {
    if (ready) return
    let cancelled = false
    const googleReturn = isGoogleReturn()
    refreshSession()
      .then((signedIn) => {
        if (googleReturn) finishGoogleReturn(signedIn)
      })
      .finally(() => {
        if (!cancelled) setReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [ready])

  if (!ready) return <PageLoader label="Signing you in…" />
  return <>{children}</>
}
