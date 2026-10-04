import { CalendarCheck, MessageSquareText, Star } from 'lucide-react'
import { Card } from '@/components/common/Card'
import { StarRating } from '@/components/feedback/StarRating'
import type { ProfileStats } from '@/features/profile/types'

/** Average rating, number of reviews and completed interviews. */
export function ProfileStatsGrid({ stats }: { stats: ProfileStats }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <Card className="p-4">
        <p className="flex items-center gap-1.5 text-xs text-fg-muted">
          <Star className="h-3.5 w-3.5" aria-hidden /> Average rating
        </p>
        <p className="mt-1.5 text-2xl font-bold tracking-tight">{stats.average_rating?.toFixed(1) ?? '—'}</p>
        <StarRating value={stats.average_rating ?? 0} className="mt-1" />
      </Card>
      <Card className="p-4">
        <p className="flex items-center gap-1.5 text-xs text-fg-muted">
          <MessageSquareText className="h-3.5 w-3.5" aria-hidden /> Reviews
        </p>
        <p className="mt-1.5 text-2xl font-bold tracking-tight">{stats.total_reviews}</p>
        <p className="mt-1 text-xs text-fg-muted">From interview partners</p>
      </Card>
      <Card className="p-4">
        <p className="flex items-center gap-1.5 text-xs text-fg-muted">
          <CalendarCheck className="h-3.5 w-3.5" aria-hidden /> Interviews
        </p>
        <p className="mt-1.5 text-2xl font-bold tracking-tight">{stats.total_interviews}</p>
        <p className="mt-1 text-xs text-fg-muted">
          {stats.interviews_as_candidate} as candidate · {stats.interviews_as_interviewer} as interviewer
        </p>
      </Card>
    </div>
  )
}
