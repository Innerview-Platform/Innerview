import { Link } from 'react-router-dom'
import { CalendarClock, DoorClosed, SearchX, Users } from 'lucide-react'
import { Button, buttonClasses } from '@/components/common/Button'
import { LogoMark } from '@/components/common/Logo'
import { getErrorMessage, toApiError } from '@/lib/apiError'
import { paths } from '@/routes/paths'

function describe(error: unknown) {
  const { status, serverMessage } = toApiError(error)
  if (status === 404) return { icon: SearchX, title: 'Room not found', text: 'Check the code or link and try again.' }
  if (status === 410) return { icon: DoorClosed, title: 'This interview has ended', text: 'The session was completed or cancelled.' }
  if (status === 403 && serverMessage?.toLowerCase().includes('full')) return { icon: Users, title: 'Room is full', text: 'This room has reached its participant limit.' }
  if (status === 403) return { icon: CalendarClock, title: "This interview hasn't started", text: serverMessage ?? 'Come back at the scheduled start time.' }
  return { icon: DoorClosed, title: "Couldn't join the room", text: getErrorMessage(error) }
}

export function RoomErrorScreen({ error, onRetry, retrying }: { error: unknown; onRetry: () => void; retrying: boolean }) {
  const { icon: Icon, title, text } = describe(error)
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <LogoMark size={32} />
      <div className="mt-10 mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-elevated text-fg-muted">
        <Icon className="h-5 w-5" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <p className="mt-2 max-w-sm text-fg-secondary">{text}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        <Button variant="secondary" onClick={onRetry} loading={retrying}>
          Try again
        </Button>
        <Link to={paths.joinRoom} className={buttonClasses({ variant: 'secondary' })}>
          Enter another code
        </Link>
        <Link to={paths.dashboard} className={buttonClasses()}>
          Dashboard
        </Link>
      </div>
    </div>
  )
}
