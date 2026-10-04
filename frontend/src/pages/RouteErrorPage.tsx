import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { buttonClasses } from '@/components/common/Button'
import NotFoundPage from '@/pages/NotFoundPage'
import { paths } from '@/routes/paths'

/** Last-resort boundary for render errors and failed lazy chunk loads. */
export default function RouteErrorPage() {
  const error = useRouteError()
  if (isRouteErrorResponse(error) && error.status === 404) return <NotFoundPage />

  if (import.meta.env.DEV) console.error(error)

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-danger/30 bg-danger/10 text-danger">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight">Something went wrong</h1>
      <p className="mt-2 max-w-sm text-fg-secondary">An unexpected error occurred. Reloading the page usually fixes it.</p>
      <div className="mt-8 flex gap-2">
        <button onClick={() => window.location.reload()} className={buttonClasses()}>
          Reload page
        </button>
        <Link to={paths.dashboard} className={buttonClasses({ variant: 'secondary' })}>
          Dashboard
        </Link>
      </div>
    </div>
  )
}
