import { Suspense } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { Code2, MessagesSquare, Video } from 'lucide-react'
import { Logo } from '@/components/common/Logo'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { PageLoader } from '@/components/feedback/states'
import { paths } from '@/routes/paths'

const HIGHLIGHTS = [
  { icon: Video, title: 'Face to face', text: 'Built-in video, so it feels like the real loop.' },
  { icon: Code2, title: 'One shared editor', text: 'Write, run and discuss code together in real time.' },
  { icon: MessagesSquare, title: 'Honest feedback', text: 'Structured reviews after every session.' },
]

export function AuthLayout() {
  return (
    <div className="flex min-h-dvh bg-bg">
      <aside className="relative hidden w-[44%] max-w-xl flex-col justify-between overflow-hidden border-r border-border bg-surface p-12 lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{ backgroundImage: 'radial-gradient(var(--color-border) 1px, transparent 1px)', backgroundSize: '22px 22px' }}
          aria-hidden
        />
        <Link to={paths.home} className="relative w-fit">
          <Logo size={30} />
        </Link>
        <div className="relative">
          <h2 className="max-w-md font-display text-[44px] leading-[1.05] tracking-tight">
            Practice interviews that feel <em className="text-brand-gradient -mr-1 pr-1">real</em>.
          </h2>
          <p className="mt-4 max-w-sm text-fg-secondary">Mock technical interviews with real engineers, in a room built for interviewing.</p>
          <ul className="mt-10 space-y-5">
            {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-bg text-primary">
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
        <p className="relative text-xs text-fg-muted">© {new Date().getFullYear()} InnerViewHub</p>
      </aside>

      <main className="relative flex flex-1 flex-col items-center justify-center px-5 py-12 sm:px-10">
        <ThemeToggle className="absolute top-4 right-4" />
        <Link to={paths.home} className="mb-10 lg:hidden">
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
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {description && <p className="mt-1.5 text-sm text-fg-secondary">{description}</p>}
    </div>
  )
}
