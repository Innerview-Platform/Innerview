import { useSearchParams } from 'react-router-dom'
import { Star } from 'lucide-react'
import { useAppSelector } from '@/app/hooks'
import { Card } from '@/components/common/Card'
import { SkeletonRows } from '@/components/common/Skeleton'
import { StarRating } from '@/components/feedback/StarRating'
import { EmptyState, ErrorState } from '@/components/feedback/states'
import { Select } from '@/components/forms/controls'
import { PageHeader } from '@/components/layout/PageHeader'
import { Pagination } from '@/components/tables/Pagination'
import { selectCurrentUser } from '@/features/auth/slices/authSlice'
import { FeedbackList } from '@/features/feedback/components/FeedbackList'
import { useFeedback, type FeedbackDirection } from '@/features/feedback/hooks/useFeedback'
import { ProfileRequired } from '@/features/profile/components/ProfileRequired'
import { useUserRating } from '@/features/profile/hooks/useProfile'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 10
const TABS: { id: FeedbackDirection; label: string }[] = [
  { id: 'received', label: 'Received' },
  { id: 'given', label: 'Given' },
]

export default function FeedbackPage() {
  useDocumentTitle('Feedback')
  return (
    <>
      <PageHeader title="Feedback" description="Ratings and comments from your interview sessions." />
      <ProfileRequired feature="your feedback">
        <FeedbackContent />
      </ProfileRequired>
    </>
  )
}

function FeedbackContent() {
  const user = useAppSelector(selectCurrentUser)!
  const [searchParams, setSearchParams] = useSearchParams()
  const direction: FeedbackDirection = searchParams.get('tab') === 'given' ? 'given' : 'received'
  const ratingParam = Number(searchParams.get('rating'))
  const rating = direction === 'received' && ratingParam >= 1 && ratingParam <= 5 ? ratingParam : undefined
  const page = Math.max(0, Number(searchParams.get('page')) || 0)

  const summary = useUserRating(user.id)
  const feedback = useFeedback(user.id, direction, { rating, page, limit: PAGE_SIZE })

  const setParams = (next: Record<string, string | undefined>) =>
    setSearchParams(Object.fromEntries(Object.entries(next).filter((entry): entry is [string, string] => Boolean(entry[1]))))

  return (
    <div className="space-y-6">
      <Card className="flex flex-wrap items-center gap-x-8 gap-y-3 p-5">
        <div>
          <p className="text-xs text-fg-muted">Average rating</p>
          <p className="mt-1 text-3xl font-bold tracking-tight">
            {summary.data ? (summary.data.total_reviews ? summary.data.average_rating.toFixed(1) : '—') : '…'}
          </p>
        </div>
        <div>
          <StarRating value={summary.data?.average_rating ?? 0} size={18} />
          <p className="mt-1 text-sm text-fg-muted">
            {summary.data ? `${summary.data.total_reviews} review${summary.data.total_reviews === 1 ? '' : 's'} received` : 'Loading…'}
          </p>
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5">
          <div role="tablist" aria-label="Feedback direction" className="flex">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={direction === tab.id}
                onClick={() => setParams({ tab: tab.id === 'given' ? 'given' : undefined })}
                className={cn(
                  '-mb-px border-b-2 px-4 py-3.5 text-sm font-medium transition-colors',
                  direction === tab.id ? 'border-primary text-primary-hover' : 'border-transparent text-fg-secondary hover:text-fg',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {direction === 'received' && (
            <div className="py-2.5">
              <label htmlFor="rating-filter" className="sr-only">
                Filter by rating
              </label>
              <Select id="rating-filter" className="h-9 w-auto min-w-36" value={rating ?? ''} onChange={(e) => setParams({ rating: e.target.value || undefined })}>
                <option value="">All ratings</option>
                {[5, 4, 3, 2, 1].map((value) => (
                  <option key={value} value={value}>
                    {value} star{value === 1 ? '' : 's'}
                  </option>
                ))}
              </Select>
            </div>
          )}
        </div>

        <div role="tabpanel">
          {feedback.isPending ? (
            <SkeletonRows rows={4} className="p-5" />
          ) : feedback.isError ? (
            <ErrorState error={feedback.error} onRetry={() => feedback.refetch()} retrying={feedback.isFetching} />
          ) : feedback.data.content.length === 0 ? (
            <EmptyState
              icon={<Star className="h-5 w-5" />}
              title={rating ? `No ${rating}-star feedback` : direction === 'received' ? 'No feedback received yet' : "You haven't given feedback yet"}
              description={direction === 'received' ? 'Feedback from your interview partners will show up here.' : 'Feedback you leave for others will show up here.'}
            />
          ) : (
            <div className={feedback.isPlaceholderData ? 'opacity-60 transition-opacity' : undefined}>
              <FeedbackList items={feedback.data.content} direction={direction} />
              <Pagination
                page={feedback.data.number}
                totalPages={feedback.data.totalPages}
                totalElements={feedback.data.totalElements}
                pageSize={feedback.data.size}
                isFetching={feedback.isFetching}
                onPageChange={(next) =>
                  setParams({
                    tab: direction === 'given' ? 'given' : undefined,
                    rating: rating ? String(rating) : undefined,
                    page: next > 0 ? String(next) : undefined,
                  })
                }
              />
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
