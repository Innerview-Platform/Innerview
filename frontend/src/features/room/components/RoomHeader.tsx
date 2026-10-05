import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, Plus, RotateCw } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { CopyButton } from '@/components/common/CopyButton'
import { LogoMark } from '@/components/common/Logo'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import type { ConnectionStatus } from '@/features/room/types'
import { cn } from '@/lib/utils'
import { paths } from '@/routes/paths'

const STATUS_LABEL: Record<ConnectionStatus, string> = {
  idle: 'Offline',
  connecting: 'Connecting…',
  connected: 'Connected',
  reconnecting: 'Reconnecting…',
  failed: 'Disconnected',
}

const STATUS_DOT: Record<ConnectionStatus, string> = {
  idle: 'bg-fg-muted',
  connecting: 'bg-warning animate-pulse',
  connected: 'bg-success',
  reconnecting: 'bg-warning animate-pulse',
  failed: 'bg-danger',
}

function formatRemaining(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  const mm = String(minutes).padStart(2, '0')
  const ss = String(seconds).padStart(2, '0')
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`
}

/** Time left; turns amber in the last five minutes. */
function RoomTimer({ endsAt, canExtend, onExtend }: { endsAt: string | null; canExtend: boolean; onExtend: () => void }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])
  if (!endsAt) return null
  const remaining = new Date(endsAt).getTime() - now
  const warning = remaining <= 5 * 60_000
  return (
    <div className="flex items-center gap-1">
      <span
        className={cn(
          'flex h-8 items-center gap-1.5 rounded-lg border px-2.5 font-mono text-[13px] tabular-nums',
          warning ? 'border-warning/50 bg-warning/10 text-warning' : 'border-border text-fg-secondary',
        )}
        title="Time left in this interview"
        role="timer"
      >
        <Clock className="h-3.5 w-3.5" aria-hidden />
        {formatRemaining(remaining)}
      </span>
      {canExtend && (
        <Button size="sm" variant="ghost" className="h-8 px-2" onClick={onExtend} title="Add 15 minutes (once)" aria-label="Add 15 minutes" leftIcon={<Plus className="h-3.5 w-3.5" />}>
          <span className="hidden sm:inline">15 min</span>
        </Button>
      )}
    </div>
  )
}

interface RoomHeaderProps {
  code: string
  title: string | null
  status: ConnectionStatus
  endsAt: string | null
  canExtend: boolean
  onExtend: () => void
  onReconnect: () => void
}

/** Where you are (title, code, invite link) and how it's going (time left, connection). */
export function RoomHeader({ code, title, status, endsAt, canExtend, onExtend, onReconnect }: RoomHeaderProps) {
  const inviteLink = `${window.location.origin}${paths.room(code)}`

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-surface px-3 sm:px-4">
      <div className="flex min-w-0 items-center gap-3">
        <Link to={paths.home} aria-label="Home" className="shrink-0">
          <LogoMark size={28} />
        </Link>
        <div className="flex min-w-0 items-center gap-1.5">
          {title && (
            <>
              <h1 className="hidden max-w-64 truncate text-sm font-semibold md:block">{title}</h1>
              <span className="hidden text-fg-muted md:inline" aria-hidden>
                /
              </span>
            </>
          )}
          <span className="truncate font-mono text-[13px] tracking-wide text-fg-secondary">{inviteLink.split('/').pop()}</span>
          <CopyButton value={inviteLink} label="Copy invite link" size="icon" variant="ghost" />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {status === 'failed' && (
          <Button size="sm" variant="secondary" onClick={onReconnect} leftIcon={<RotateCw className="h-3.5 w-3.5" />}>
            Reconnect
          </Button>
        )}
        <span
          className="flex h-8 items-center gap-2 rounded-lg px-1.5 text-xs text-fg-secondary"
          role="status"
          aria-live="polite"
          title={STATUS_LABEL[status]}
        >
          <span className={cn('h-2 w-2 rounded-full', STATUS_DOT[status])} aria-hidden />
          <span className="hidden lg:inline">{STATUS_LABEL[status]}</span>
          <span className="sr-only lg:hidden">{STATUS_LABEL[status]}</span>
        </span>
        <RoomTimer endsAt={endsAt} canExtend={canExtend} onExtend={onExtend} />
        <ThemeToggle className="hidden sm:flex" />
      </div>
    </header>
  )
}
