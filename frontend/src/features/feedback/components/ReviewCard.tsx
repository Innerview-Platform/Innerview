import { Avatar } from '@/components/common/Avatar'
import { Badge } from '@/components/common/Badge'
import { StarRating } from '@/components/feedback/StarRating'
import type { ReviewDirection, ReviewSummary } from '@/features/feedback/api/reviewsApi'
import { HIRE_SIGNAL_LABELS, reviewerRoleLabel } from '@/features/feedback/utils/reviewLabels'
import { formatDate } from '@/lib/utils'

interface ReviewCardProps {
  review: ReviewSummary
  direction: ReviewDirection
  onOpen: () => void
}

/** Summary of one review; opens the full review on click. */
export function ReviewCard({ review, direction, onOpen }: ReviewCardProps) {
  const role = reviewerRoleLabel(review.reviewer_role)
  const signal = review.hire_signal ? HIRE_SIGNAL_LABELS[review.hire_signal] : null
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex h-full w-full flex-col gap-3 rounded-xl border border-border bg-surface p-4 text-left transition-colors hover:border-fg-muted focus-visible:border-primary focus-visible:outline-none"
    >
      <div className="flex items-center gap-3">
        <Avatar label={review.person.name} src={review.person.avatar_thumb_url} size={36} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            <span className="text-fg-muted">{direction === 'received' ? 'From ' : 'For '}</span>
            {review.person.name}
          </p>
          <p className="truncate text-xs text-fg-muted">
            {[review.person.username && `@${review.person.username}`, role].filter(Boolean).join(' · ')}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <StarRating value={review.rating} />
        <span className="text-sm font-medium">{review.rating}/5</span>
        {signal && <Badge tone={signal.tone}>{signal.label}</Badge>}
      </div>
      <p className="line-clamp-3 flex-1 text-sm text-fg-secondary">
        {review.excerpt ?? <span className="text-fg-muted italic">No written comment.</span>}
      </p>
      <p className="truncate text-xs text-fg-muted">
        {review.interview.title || 'Interview'} · {formatDate(review.created_at)}
      </p>
    </button>
  )
}
