import { Link } from 'react-router-dom'
import { Avatar } from '@/components/common/Avatar'
import { Badge } from '@/components/common/Badge'
import { buttonClasses } from '@/components/common/Button'
import { SkeletonRows } from '@/components/common/Skeleton'
import { StarRating } from '@/components/feedback/StarRating'
import { ErrorState } from '@/components/feedback/states'
import { Modal } from '@/components/modals/Modal'
import { INTERVIEW_TYPE_LABELS, labelFor } from '@/constants/enums'
import type { ReviewDirection } from '@/features/feedback/api/reviewsApi'
import { useReviewDetail } from '@/features/feedback/hooks/useReviews'
import { HIRE_SIGNAL_LABELS, reviewerRoleLabel } from '@/features/feedback/utils/reviewLabels'
import { ProfileLink } from '@/features/profile/components/ProfileLink'
import { paths } from '@/routes/paths'
import { formatDate } from '@/lib/utils'

interface ReviewDetailModalProps {
  reviewId: number | null
  direction: ReviewDirection
  onClose: () => void
}

/** The full review: comment, rubric scores, hire signal and the interview it belongs to. */
export function ReviewDetailModal({ reviewId, direction, onClose }: ReviewDetailModalProps) {
  const review = useReviewDetail(reviewId)
  const data = review.data

  return (
    <Modal
      open={reviewId !== null}
      onClose={onClose}
      title={direction === 'received' ? 'Review about you' : 'Your review'}
      className="max-w-xl"
      footer={
        data && (
          <Link to={paths.interview(data.interview.id)} className={buttonClasses({ variant: 'secondary' })} onClick={onClose}>
            Open interview
          </Link>
        )
      }
    >
      {review.isPending && <SkeletonRows rows={5} />}
      {review.isError && <ErrorState error={review.error} onRetry={() => review.refetch()} retrying={review.isFetching} />}
      {data && (
        <div className="max-h-[65vh] space-y-5 overflow-y-auto pr-1">
          <div className="flex items-center gap-3">
            <Avatar label={data.person.name} src={data.person.avatar_thumb_url} size={44} />
            <div className="min-w-0">
              <ProfileLink username={data.person.username} className="font-medium">
                {data.person.name}
              </ProfileLink>
              <p className="text-xs text-fg-muted">
                {[reviewerRoleLabel(data.reviewer_role) && `${direction === 'received' ? 'Reviewed you as' : 'You reviewed as'} ${reviewerRoleLabel(data.reviewer_role)?.toLowerCase()}`, formatDate(data.created_at)]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <StarRating value={data.rating} size={20} />
            <span className="text-lg font-semibold">{data.rating}/5</span>
            {data.hire_signal && <Badge tone={HIRE_SIGNAL_LABELS[data.hire_signal].tone}>{HIRE_SIGNAL_LABELS[data.hire_signal].label}</Badge>}
          </div>

          <section>
            <h3 className="text-xs font-semibold tracking-wide text-fg-muted uppercase">Comment</h3>
            <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-line text-fg-secondary">
              {data.comment || <span className="text-fg-muted italic">No written comment.</span>}
            </p>
          </section>

          {data.scores.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold tracking-wide text-fg-muted uppercase">Scorecard</h3>
              <ul className="mt-2 space-y-2.5">
                {data.scores.map((score) => (
                  <li key={score.id} className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm">{score.label}</p>
                      {score.description && <p className="text-xs text-fg-muted">{score.description}</p>}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <StarRating value={score.score} size={12} />
                      <span className="w-7 text-right text-sm text-fg-secondary">{score.score}/5</span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="rounded-lg border border-border bg-elevated/50 px-3 py-2.5 text-sm">
            <p className="font-medium">{data.interview.title || 'Interview'}</p>
            <p className="text-xs text-fg-muted">
              {[data.interview.type && labelFor(INTERVIEW_TYPE_LABELS, data.interview.type), formatDate(data.interview.start_time)]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </section>
        </div>
      )}
    </Modal>
  )
}
