import { Link } from 'react-router-dom'
import { LogOut, RotateCw } from 'lucide-react'
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

interface RoomHeaderProps {
  roomId: string
  status: ConnectionStatus
  onReconnect: () => void
  onLeave: () => void
  leaving: boolean
}

export function RoomHeader({ roomId, status, onReconnect, onLeave, leaving }: RoomHeaderProps) {
  const inviteLink = `${window.location.origin}${paths.room(roomId)}`

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-surface px-3 sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <Link to={paths.dashboard} aria-label="Dashboard" className="shrink-0">
          <LogoMark size={26} />
        </Link>
        <div className="flex min-w-0 items-center gap-2">
          <span className="hidden text-sm text-fg-muted sm:inline">Room</span>
          <span className="font-mono text-sm font-semibold tracking-wider">{roomId}</span>
          <CopyButton value={inviteLink} label="Copy invite link" size="icon" variant="ghost" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="flex items-center gap-2 rounded-full border border-border px-2.5 py-1 text-xs text-fg-secondary" role="status" aria-live="polite">
          <span className={cn('h-2 w-2 rounded-full', STATUS_DOT[status])} aria-hidden />
          <span className="hidden sm:inline">{STATUS_LABEL[status]}</span>
        </span>
        {status === 'failed' && (
          <Button size="sm" variant="secondary" onClick={onReconnect} leftIcon={<RotateCw className="h-3.5 w-3.5" />}>
            Reconnect
          </Button>
        )}
        <Button
          size="sm"
          className="bg-danger shadow-danger/20 hover:bg-danger/85"
          onClick={onLeave}
          loading={leaving}
          leftIcon={<LogOut className="h-3.5 w-3.5" />}
        >
          Leave
        </Button>
      </div>
    </header>
  )
}
