import { Link } from 'react-router-dom'
import { ArrowRight, CalendarClock, CheckCircle2 } from 'lucide-react'
import { Button, buttonClasses } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { CopyButton } from '@/components/common/CopyButton'
import { Alert } from '@/components/feedback/Alert'
import { INTERVIEW_TYPE_LABELS } from '@/constants/enums'
import type { CreatedInterview } from '@/features/interviews/types'
import type { InterviewType } from '@/constants/enums'
import { formatDateTime } from '@/lib/utils'
import { paths } from '@/routes/paths'

interface RoomCreatedCardProps {
  interview: CreatedInterview
  type: InterviewType
  /** ISO start time for scheduled interviews. */
  startTime?: string
  onCreateAnother: () => void
}

export function RoomCreatedCard({ interview, type, startTime, onCreateAnother }: RoomCreatedCardProps) {
  const scheduled = Boolean(startTime)

  return (
    <Card className="mx-auto max-w-xl animate-fade-in p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/15 text-success">
          {scheduled ? <CalendarClock className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
        </span>
        <div>
          <h2 className="text-lg font-semibold">{scheduled ? 'Interview scheduled' : 'Your room is ready'}</h2>
          <p className="text-sm text-fg-muted">
            {INTERVIEW_TYPE_LABELS[type]}
            {startTime && ` · ${formatDateTime(startTime)}`}
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <div>
          <p className="text-xs font-medium text-fg-muted uppercase">Room code</p>
          <div className="mt-1.5 flex items-center justify-between gap-3 rounded-lg border border-border bg-elevated px-4 py-3">
            <span className="font-mono text-2xl tracking-[0.2em]">{interview.roomId}</span>
            <CopyButton value={interview.roomId} label="Copy code" />
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-fg-muted uppercase">Invite link</p>
          <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-border bg-elevated py-2 pr-2 pl-3">
            <span className="min-w-0 flex-1 truncate font-mono text-[13px] text-fg-secondary">{interview.roomLink}</span>
            <CopyButton value={interview.roomLink} label="Copy link" />
          </div>
        </div>
      </div>

      {scheduled && (
        <Alert tone="info" className="mt-5">
          Save the code or link now — InnerView can&apos;t list scheduled interviews yet. The room opens at the start time.
        </Alert>
      )}

      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <Button variant="ghost" onClick={onCreateAnother}>
          Create another
        </Button>
        {!scheduled && (
          <Link to={paths.room(interview.roomId)} className={buttonClasses()}>
            Enter room <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </Card>
  )
}
