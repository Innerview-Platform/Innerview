import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { Briefcase, CalendarCheck, GraduationCap } from 'lucide-react'
import { Avatar } from '@/components/common/Avatar'
import { Skeleton } from '@/components/common/Skeleton'
import { StarRating } from '@/components/feedback/StarRating'
import { EMPLOYMENT_STATUS_LABELS, labelFor } from '@/constants/enums'
import { usePublicProfile } from '@/features/profile/hooks/useProfile'
import { paths } from '@/routes/paths'
import { cn } from '@/lib/utils'

const OPEN_DELAY = 350
const CLOSE_DELAY = 150
const CARD_WIDTH = 288

interface ProfileLinkProps {
  /** Null for accounts without a username (and deleted accounts): renders plain text. */
  username: string | null | undefined
  children: ReactNode
  className?: string
  /** Open the profile in a new tab, e.g. from the interview room so the call isn't interrupted. */
  newTab?: boolean
}

/** A person's name that links to their public profile and shows a summary card on hover or focus. */
export function ProfileLink({ username, children, className, newTab }: ProfileLinkProps) {
  const anchorRef = useRef<HTMLAnchorElement>(null)
  const timer = useRef<number | undefined>(undefined)
  const [open, setOpen] = useState(false)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  if (!username) return <span className={className}>{children}</span>

  const schedule = (next: boolean) => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setOpen(next), next ? OPEN_DELAY : CLOSE_DELAY)
  }

  return (
    <>
      <Link
        ref={anchorRef}
        to={paths.publicProfile(username)}
        target={newTab ? '_blank' : undefined}
        rel={newTab ? 'noopener' : undefined}
        className={cn('hover:underline focus-visible:underline', className)}
        onMouseEnter={() => schedule(true)}
        onMouseLeave={() => schedule(false)}
        onFocus={() => schedule(true)}
        onBlur={() => schedule(false)}
        onClick={() => setOpen(false)}
      >
        {children}
      </Link>
      {open && anchorRef.current && (
        <HoverCard
          anchor={anchorRef.current}
          username={username}
          onEnter={() => window.clearTimeout(timer.current)}
          onLeave={() => schedule(false)}
        />
      )}
    </>
  )
}

interface HoverCardProps {
  anchor: HTMLElement
  username: string
  onEnter: () => void
  onLeave: () => void
}

/** Fixed-position card in a portal, so scrolling panels can't clip it; flips above when there's no room below. */
function HoverCard({ anchor, username, onEnter, onLeave }: HoverCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)
  const profile = usePublicProfile(username)

  useLayoutEffect(() => {
    const place = () => {
      const rect = anchor.getBoundingClientRect()
      const height = cardRef.current?.offsetHeight ?? 160
      const below = rect.bottom + 8
      const top = below + height > window.innerHeight - 8 ? Math.max(8, rect.top - height - 8) : below
      const left = Math.min(Math.max(8, rect.left), window.innerWidth - CARD_WIDTH - 8)
      setPosition({ top, left })
    }
    place()
    window.addEventListener('scroll', place, true)
    window.addEventListener('resize', place)
    return () => {
      window.removeEventListener('scroll', place, true)
      window.removeEventListener('resize', place)
    }
  }, [anchor, profile.data])

  const data = profile.data
  const work = data && (data.employment_status === 'EMPLOYED' ? data.company : labelFor(EMPLOYMENT_STATUS_LABELS, data.employment_status))
  const education = data && [data.college, data.university].filter(Boolean).join(', ')

  return createPortal(
    <div
      ref={cardRef}
      role="tooltip"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={{ top: position?.top ?? -9999, left: position?.left ?? -9999, width: CARD_WIDTH }}
      className="fixed z-[60] animate-fade-in rounded-xl border border-border bg-surface p-4 text-left shadow-2xl"
    >
      {profile.isPending ? (
        <div className="flex gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ) : !data ? (
        <p className="text-sm text-fg-muted">Profile unavailable.</p>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <Avatar label={data.name} src={data.avatar_thumb_url} size={48} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-fg">{data.name}</p>
              <p className="truncate text-xs text-fg-muted">@{data.username}</p>
            </div>
          </div>
          {data.headline && <p className="mt-2.5 line-clamp-2 text-sm text-fg-secondary">{data.headline}</p>}
          <ul className="mt-2 space-y-1 text-xs text-fg-secondary">
            {work && work !== '—' && (
              <li className="flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5 shrink-0 text-fg-muted" aria-hidden /> <span className="truncate">{work}</span>
              </li>
            )}
            {education && (
              <li className="flex items-center gap-1.5">
                <GraduationCap className="h-3.5 w-3.5 shrink-0 text-fg-muted" aria-hidden /> <span className="truncate">{education}</span>
              </li>
            )}
          </ul>
          <div className="mt-3 flex items-center justify-between border-t border-border pt-2.5 text-xs text-fg-muted">
            <span className="flex items-center gap-1.5">
              <StarRating value={data.average_rating ?? 0} size={12} />
              {data.average_rating ? `${data.average_rating.toFixed(1)} (${data.total_reviews})` : 'No reviews'}
            </span>
            <span className="flex items-center gap-1">
              <CalendarCheck className="h-3.5 w-3.5" aria-hidden /> {data.total_interviews} interviews
            </span>
          </div>
        </>
      )}
    </div>,
    document.body,
  )
}
