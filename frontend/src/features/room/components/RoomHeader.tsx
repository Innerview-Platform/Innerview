import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Clock, LogOut, Plus, RotateCw } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { CopyButton } from '@/components/common/CopyButton'
import { LogoMark } from '@/components/common/Logo'
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
          'flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-xs tabular-nums',
          warning ? 'border-warning/50 bg-warning/10 text-warning' : 'border-border text-fg-secondary',
        )}
        title="Time left in this interview"
        role="timer"
      >
        <Clock className="h-3.5 w-3.5" aria-hidden />
        {formatRemaining(remaining)}
      </span>
      {canExtend && (
        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={onExtend} title="Add 15 minutes (once)" leftIcon={<Plus className="h-3.5 w-3.5" />}>
          15 min
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
  onLeave: () => void
  leaving: boolean
  /** Host/interviewers: ends and saves the interview for everyone. */
  onEnd?: () => void
  /** Extra controls shown before the connection status (e.g. panel toggles). */
  children?: ReactNode
}

export function RoomHeader({ code, title, status, endsAt, canExtend, onExtend, onReconnect, onLeave, leaving, onEnd, children }: RoomHeaderProps) {
  const inviteLink = `${window.location.origin}${paths.room(code)}`

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-surface px-3 sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <Link to={paths.home} aria-label="Home" className="shrink-0">
          <LogoMark size={26} />
        </Link>
        <div className="flex min-w-0 items-center gap-2">
          {title && <span className="hidden max-w-56 truncate text-sm font-semibold lg:inline">{title}</span>}
          <span className="font-mono text-sm tracking-wide text-fg-secondary">{inviteLink.split('/').pop()}</span>
          <CopyButton value={inviteLink} label="Copy invite link" size="icon" variant="ghost" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {children}
        <RoomTimer endsAt={endsAt} canExtend={canExtend} onExtend={onExtend} />
        <span className="flex items-center gap-2 rounded-full border border-border px-2.5 py-1 text-xs text-fg-secondary" role="status" aria-live="polite">
          <span className={cn('h-2 w-2 rounded-full', STATUS_DOT[status])} aria-hidden />
          <span className="hidden xl:inline">{STATUS_LABEL[status]}</span>
        </span>
        {status === 'failed' && (
          <Button size="sm" variant="secondary" onClick={onReconnect} leftIcon={<RotateCw className="h-3.5 w-3.5" />}>
            Reconnect
          </Button>
        )}
        {onEnd && (
          <Button size="sm" variant="danger" onClick={onEnd} title="End and save the interview for everyone" className="hidden sm:inline-flex">
            End interview
          </Button>
        )}
        <Button size="sm" className="bg-danger shadow-danger/20 hover:bg-danger/85" onClick={onLeave} loading={leaving} leftIcon={<LogOut className="h-3.5 w-3.5" />}>
          Leave
        </Button>
      </div>
    </header>
  )
}
