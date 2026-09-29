import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CalendarClock, DoorOpen, Radio } from 'lucide-react'
import { Badge } from '@/components/common/Badge'
import { buttonClasses } from '@/components/common/Button'
import { SkeletonRows } from '@/components/common/Skeleton'
import { EmptyState, ErrorState } from '@/components/feedback/states'
import { INTERVIEW_TYPE_LABELS, labelFor } from '@/constants/enums'
import { interviewsApi } from '@/features/interviews/api/interviewsApi'
import { ROOM_ROLE_LABELS } from '@/features/room/utils/labels'
import { formatDateTime } from '@/lib/utils'
import { paths } from '@/routes/paths'

/** Interviews you host or are invited to that haven't ended — live ones first, with Join buttons. */
export function UpcomingInterviews({ limit }: { limit?: number }) {
  const upcoming = useQuery({ queryKey: ['interviews', 'upcoming'], queryFn: interviewsApi.getUpcoming, refetchInterval: 30_000 })

  if (upcoming.isPending) return <SkeletonRows rows={3} />
  if (upcoming.isError) return <ErrorState error={upcoming.error} onRetry={() => upcoming.refetch()} retrying={upcoming.isFetching} />
  const items = limit ? upcoming.data.slice(0, limit) : upcoming.data
  if (items.length === 0) {
    return <EmptyState icon={<CalendarClock className="h-5 w-5" />} title="Nothing scheduled" description="Interviews you create or are invited to show up here." />
  }

  return (
    <ul className="divide-y divide-border">
      {items.map((item) => {
        const soon = item.startTime && new Date(item.startTime).getTime() - Date.now() < 10 * 60_000
        return (
          <li key={item.id} className="flex flex-wrap items-center gap-3 py-3">
            <div className="min-w-0 flex-1">
              <Link to={paths.interview(item.id)} className="flex items-center gap-2 font-medium hover:underline">
                <span className="truncate">{item.title || `${labelFor(INTERVIEW_TYPE_LABELS, item.type)} interview`}</span>
                {item.live && (
                  <Badge tone="success">
                    <Radio className="h-3 w-3" /> Live
                  </Badge>
                )}
              </Link>
              <p className="mt-0.5 text-xs text-fg-muted">
                {item.startTime ? formatDateTime(item.startTime) : ''} · {ROOM_ROLE_LABELS[item.role]}
                {item.owner ? ' · you host' : item.hostName ? ` · hosted by ${item.hostName}` : ''}
              </p>
            </div>
            {(item.live || soon) && (
              <Link to={paths.room(item.code)} className={buttonClasses({ size: 'sm' })}>
                <DoorOpen className="h-4 w-4" /> Join
              </Link>
            )}
          </li>
        )
      })}
    </ul>
  )
}
