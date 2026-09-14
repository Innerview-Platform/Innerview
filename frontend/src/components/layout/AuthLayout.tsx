import { Suspense } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { Code2, MessagesSquare, Video } from 'lucide-react'
import { Logo } from '@/components/common/Logo'
import { PageLoader } from '@/components/feedback/states'
import { paths } from '@/routes/paths'

const HIGHLIGHTS = [
  { icon: Video, title: 'Live interview rooms', text: 'Meet your peer face to face with built-in video.' },
  { icon: Code2, title: 'Collaborative coding', text: 'Solve problems together in a real-time shared editor.' },
  { icon: MessagesSquare, title: 'Structured feedback', text: 'Track ratings and reviews from every session.' },
]

export function AuthLayout() {
  return (
    <div className="flex min-h-dvh bg-bg">
      <aside className="relative hidden w-[44%] max-w-xl flex-col justify-between overflow-hidden border-r border-border bg-surface p-12 lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'linear-gradient(var(--color-border-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--color-border-subtle) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
          aria-hidden
        />
        <Link to={paths.root} className="relative w-fit">
          <Logo size={32} />
        </Link>
        <div className="relative">
          <h2 className="max-w-sm text-3xl leading-tight font-bold tracking-tight">
            Practice interviews that feel <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">real</span>.
          </h2>
          <p className="mt-3 max-w-sm text-fg-secondary">Peer-to-peer mock interviews for software engineers.</p>
          <ul className="mt-10 space-y-5">
            {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-elevated text-primary-hover">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-medium">{title}</p>
                  <p className="text-sm text-fg-muted">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-fg-muted">© {new Date().getFullYear()} InnerView</p>
      </aside>

      <main className="flex flex-1 flex-col items-center justify-center px-5 py-12 sm:px-10">
        <Link to={paths.root} className="mb-10 lg:hidden">
          <Logo size={30} />
        </Link>
        <div className="w-full max-w-[400px] animate-fade-in">
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </div>
      </main>
    </div>
  )
}

export function AuthHeading({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-7">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      {description && <p className="mt-1.5 text-sm text-fg-secondary">{description}</p>}
    </div>
  )
}
