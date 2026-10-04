import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAppSelector } from '@/app/hooks'
import { selectIsAuthenticated } from '@/features/auth/slices/authSlice'
import { paths } from '@/routes/paths'

export interface RedirectState {
  from?: string
}

/** Only signed-in users; others go to login and come back afterwards. */
export function ProtectedRoute() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const location = useLocation()

  if (!isAuthenticated) {
    const from = `${location.pathname}${location.search}${location.hash}`
    return <Navigate to={paths.login} replace state={{ from } satisfies RedirectState} />
  }
  return <Outlet />
}

/** Only signed-out users (login, register, forgot password). */
export function GuestRoute() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const location = useLocation()

  if (isAuthenticated) {
    const from = (location.state as RedirectState | null)?.from
    return <Navigate to={from && from.startsWith('/') ? from : paths.dashboard} replace />
  }
  return <Outlet />
}
