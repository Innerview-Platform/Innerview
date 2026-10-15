import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ChevronRight } from 'lucide-react'
import { useAppSelector } from '@/app/hooks'
import { buttonClasses } from '@/components/common/Button'
import { Logo } from '@/components/common/Logo'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { selectIsAuthenticated } from '@/features/auth/slices/authSlice'
import { paths } from '@/routes/paths'
import { cn } from '@/lib/utils'

/**
 * Header, footer and text styles for the public pages (landing and the content pages). These pages are
 * prerendered at build time (src/entry-prerender.tsx), so keep render output free of browser-only state.
 */

export const CONTENT_NAV = [
  { to: paths.systemDesignMockInterview, label: 'System design' },
  { to: paths.mockCodingInterview, label: 'Coding' },
  { to: paths.mockInterviewWithAFriend, label: 'Guide' },
  { to: paths.feedbackRubric, label: 'Feedback rubric' },
]

export function AccountActions() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  if (isAuthenticated) {
    return (
      <Link to={paths.home} className={buttonClasses()}>
        Open dashboard
      </Link>
    )
  }
  return (
    <>
      <Link to={paths.login} className={buttonClasses({ variant: 'ghost', className: 'hidden sm:inline-flex' })}>
        Sign in
      </Link>
      <Link to={paths.signup} className={buttonClasses()}>
        Get started
      </Link>
    </>
  )
}

export function SiteHeader({ nav }: { nav?: ReactNode }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border-subtle bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to={paths.home} aria-label="InnerViewHub home">
          <Logo size={30} compactOnMobile />
        </Link>
        {nav ?? (
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
            {CONTENT_NAV.map((item) => (
              <Link key={item.to} to={item.to} className="rounded-lg px-3 py-2 text-sm text-fg-secondary transition-colors hover:text-fg">
                {item.label}
              </Link>
            ))}
          </nav>
        )}
        <div className="flex items-center gap-1 sm:gap-2">
          <ThemeToggle />
          <AccountActions />
        </div>
      </div>
    </header>
  )
}

const FOOTER_GROUPS = [
  {
    title: 'Practice',
    links: [
      { to: paths.systemDesignMockInterview, label: 'System design mock interviews' },
      { to: paths.mockCodingInterview, label: 'Mock coding interviews' },
      { to: paths.join, label: 'Join with a room code' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { to: paths.mockInterviewWithAFriend, label: 'How to run a mock interview with a friend' },
      { to: paths.feedbackRubric, label: 'Mock interview feedback rubric' },
    ],
  },
  {
    title: 'Account',
    links: [
      { to: paths.signup, label: 'Create a free account' },
      { to: paths.login, label: 'Sign in' },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-border-subtle">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.2fr_repeat(3,1fr)]">
        <div>
          <Logo size={24} />
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-fg-muted">
            Mock technical interviews with someone you choose: video, a shared editor, a whiteboard and structured feedback.
          </p>
        </div>
        {FOOTER_GROUPS.map((group) => (
          <nav key={group.title} aria-label={group.title}>
            <p className="text-sm font-semibold">{group.title}</p>
            <ul className="mt-3 space-y-2 text-sm">
              {group.links.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-fg-muted transition-colors hover:text-fg">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="mx-auto max-w-6xl border-t border-border-subtle px-4 py-6 text-sm text-fg-muted sm:px-6">
        © {new Date().getFullYear()} InnerViewHub. Practice makes calm.
      </div>
    </footer>
  )
}

export interface Crumb {
  to: string
  label: string
}

/** Visible breadcrumbs; the matching BreadcrumbList JSON-LD comes from src/seo/head.ts. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-fg-muted">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, index) => (
          <li key={item.to} className="flex items-center gap-1.5">
            {index > 0 && <ChevronRight className="h-3.5 w-3.5" aria-hidden />}
            {index === items.length - 1 ? (
              <span aria-current="page" className="text-fg-secondary">
                {item.label}
              </span>
            ) : (
              <Link to={item.to} className="hover:text-fg">
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

/** Page shell for the content pages: header, breadcrumbs, hero, article body, footer. */
export function ContentPage({
  crumbs,
  eyebrow,
  title,
  lead,
  meta,
  children,
}: {
  crumbs: Crumb[]
  eyebrow: string
  title: ReactNode
  lead: ReactNode
  meta?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="min-h-dvh overflow-x-clip bg-bg">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-elevated focus:px-3 focus:py-2">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main">
        <div className="mx-auto max-w-3xl px-4 pt-10 pb-20 sm:px-6 sm:pt-14">
          <Breadcrumbs items={crumbs} />
          <p className="mt-8 font-mono text-xs tracking-wide text-primary uppercase">{eyebrow}</p>
          <h1 className="mt-3 font-display text-[40px] leading-[1.05] tracking-tight sm:text-5xl">{title}</h1>
          <p className="mt-5 text-lg leading-relaxed text-fg-secondary">{lead}</p>
          {meta && <p className="mt-4 text-sm text-fg-muted">{meta}</p>}
          <div className="mt-10">{children}</div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}

// ── Text primitives (no typography plugin in this project) ────────────────────

export function H2({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <h2 id={id} className="mt-14 scroll-mt-20 font-display text-3xl leading-tight tracking-tight first:mt-0 sm:text-[34px]">
      {children}
    </h2>
  )
}

export function H3({ children }: { children: ReactNode }) {
  return <h3 className="mt-8 text-lg font-semibold">{children}</h3>
}

export function P({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn('mt-4 text-[16.5px] leading-relaxed text-fg-secondary', className)}>{children}</p>
}

export function UL({ children }: { children: ReactNode }) {
  return <ul className="mt-4 list-disc space-y-2 pl-5 text-[16.5px] leading-relaxed text-fg-secondary marker:text-fg-muted">{children}</ul>
}

export function OL({ children }: { children: ReactNode }) {
  return <ol className="mt-4 list-decimal space-y-2 pl-5 text-[16.5px] leading-relaxed text-fg-secondary marker:text-fg-muted">{children}</ol>
}

export function Strong({ children }: { children: ReactNode }) {
  return <strong className="font-semibold text-fg">{children}</strong>
}

/** In-text link to another page on the site. */
export function A({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="font-medium text-fg underline decoration-border underline-offset-4 hover:decoration-fg">
      {children}
    </Link>
  )
}

/** A simple table: first column as row headers. */
export function Table({ caption, head, rows }: { caption: string; head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="mt-6 overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[520px] border-collapse text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-surface">
          <tr>
            {head.map((cell) => (
              <th key={cell} scope="col" className="border-b border-border px-4 py-3 font-semibold text-fg">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-b border-border-subtle last:border-0 align-top">
              {row.map((cell, cellIndex) =>
                cellIndex === 0 ? (
                  <th key={cellIndex} scope="row" className="px-4 py-3 font-medium text-fg">
                    {cell}
                  </th>
                ) : (
                  <td key={cellIndex} className="px-4 py-3 leading-relaxed text-fg-secondary">
                    {cell}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Closing call to action shared by the content pages. */
export function CallToAction({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-16 rounded-2xl border border-border bg-surface p-6 sm:p-8">
      <h2 className="font-display text-3xl leading-tight tracking-tight">{title}</h2>
      <p className="mt-3 text-fg-secondary">{children}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link to={paths.signup} className={buttonClasses({ size: 'lg' })}>
          Create a free account <ArrowRight className="h-4 w-4" />
        </Link>
        <Link to={paths.join} className={buttonClasses({ size: 'lg', variant: 'secondary' })}>
          Join with a room code
        </Link>
      </div>
    </section>
  )
}

/** "Keep reading" links at the end of a content page. */
export function Related({ links }: { links: { to: string; title: string; text: string }[] }) {
  return (
    <section className="mt-16" aria-labelledby="related">
      <h2 id="related" className="text-sm font-semibold tracking-wide text-fg-muted uppercase">
        Keep reading
      </h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {links.map((link) => (
          <li key={link.to}>
            <Link to={link.to} className="block h-full rounded-xl border border-border p-4 transition-colors hover:border-fg-muted">
              <span className="font-semibold text-fg">{link.title}</span>
              <span className="mt-1 block text-sm text-fg-secondary">{link.text}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** "October 9, 2026" from "2026-10-09"; fixed locale and time zone so prerendered and hydrated text match. */
export function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
}
