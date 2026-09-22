import { Suspense, useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { Logo } from '@/components/common/Logo'
import { PageLoader } from '@/components/feedback/states'
import { Sidebar } from '@/components/navigation/Sidebar'
import { mobileNavClosed, mobileNavOpened, selectMobileNavOpen, selectSidebarCollapsed } from '@/store/uiSlice'
import { cn } from '@/lib/utils'
import { paths } from '@/routes/paths'

export function AppLayout() {
  const dispatch = useAppDispatch()
  const collapsed = useAppSelector(selectSidebarCollapsed)
  const mobileOpen = useAppSelector(selectMobileNavOpen)
  const { pathname } = useLocation()

  useEffect(() => {
    dispatch(mobileNavClosed())
    window.scrollTo(0, 0)
  }, [pathname, dispatch])

  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && dispatch(mobileNavClosed())
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [mobileOpen, dispatch])

  return (
    <div className="min-h-dvh bg-bg">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-elevated focus:px-3 focus:py-2">
        Skip to content
      </a>

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 hidden border-r border-border bg-surface transition-[width] duration-200 lg:block',
          collapsed ? 'w-16' : 'w-60',
        )}
      >
        <Sidebar />
      </aside>

      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-surface/90 px-4 backdrop-blur lg:hidden">
        <Link to={paths.dashboard}>
          <Logo size={26} />
        </Link>
        <button
          onClick={() => dispatch(mobileNavOpened())}
          className="rounded-md p-2 text-fg-secondary hover:bg-elevated hover:text-fg"
          aria-label="Open navigation"
          aria-expanded={mobileOpen}
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="absolute inset-0 bg-black/60" onClick={() => dispatch(mobileNavClosed())} aria-hidden />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85%] animate-fade-in border-r border-border bg-surface">
            <button
              onClick={() => dispatch(mobileNavClosed())}
              className="absolute top-4 right-3 z-10 rounded-md p-1.5 text-fg-muted hover:bg-elevated hover:text-fg"
              aria-label="Close navigation"
            >
              <X className="h-4 w-4" />
            </button>
            <Sidebar variant="mobile" />
          </div>
        </div>
      )}

      <main id="main" className={cn('transition-[padding] duration-200', collapsed ? 'lg:pl-16' : 'lg:pl-60')}>
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </div>
      </main>
    </div>
  )
}
