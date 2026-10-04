import { useSearchParams } from 'react-router-dom'
import { Lock, Star } from 'lucide-react'
import { Card } from '@/components/common/Card'
import { SkeletonRows } from '@/components/common/Skeleton'
import { StarRating } from '@/components/feedback/StarRating'
import { EmptyState, ErrorState } from '@/components/feedback/states'
import { Select } from '@/components/forms/controls'
import { PageHeader } from '@/components/layout/PageHeader'
import { Pagination } from '@/components/tables/Pagination'
import type { ReviewDirection } from '@/features/feedback/api/reviewsApi'
import { ReviewsGrid } from '@/features/feedback/components/ReviewsGrid'
import { useReviews } from '@/features/feedback/hooks/useReviews'
import { useMyProfile } from '@/features/profile/hooks/useProfile'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 12
const TABS: { id: ReviewDirection; label: string }[] = [
  { id: 'received', label: 'About you' },
  { id: 'given', label: 'Written by you' },
]

export default function FeedbackPage() {
  useDocumentTitle('Feedback')
  const [searchParams, setSearchParams] = useSearchParams()
  const direction: ReviewDirection = searchParams.get('tab') === 'given' ? 'given' : 'received'
  const ratingParam = Number(searchParams.get('rating'))
  const rating = direction === 'received' && ratingParam >= 1 && ratingParam <= 5 ? ratingParam : undefined
  const page = Math.max(0, Number(searchParams.get('page')) || 0)

  const profile = useMyProfile()
  const reviews = useReviews(direction, { rating, page, size: PAGE_SIZE })

  const setParams = (next: Record<string, string | undefined>) =>
    setSearchParams(Object.fromEntries(Object.entries(next).filter((entry): entry is [string, string] => Boolean(entry[1]))))

  const average = profile.data?.average_rating ?? null
  const total = profile.data?.total_reviews ?? 0

  return (
    <>
      <PageHeader
        title="Feedback"
        description={
          <span className="flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5" aria-hidden /> Private — only you can see these reviews. Others see just your average rating.
          </span>
        }
      />
      <div className="space-y-6">
        <Card className="flex flex-wrap items-center gap-x-8 gap-y-3 p-5">
          <div>
            <p className="text-xs text-fg-muted">Average rating</p>
            <p className="mt-1 text-3xl font-bold tracking-tight">{profile.data ? (average?.toFixed(1) ?? '—') : '…'}</p>
          </div>
          <div>
            <StarRating value={average ?? 0} size={18} />
            <p className="mt-1 text-sm text-fg-muted">{profile.data ? `${total} review${total === 1 ? '' : 's'} received` : 'Loading…'}</p>
          </div>
        </Card>

        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-3 sm:px-5">
            <div role="tablist" aria-label="Reviews" className="flex">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={direction === tab.id}
                  onClick={() => setParams({ tab: tab.id === 'given' ? 'given' : undefined })}
                  className={cn(
                    '-mb-px border-b-2 px-3 py-3.5 text-sm font-medium transition-colors sm:px-4',
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
            {reviews.isPending ? (
              <SkeletonRows rows={4} className="p-5" />
            ) : reviews.isError ? (
              <ErrorState error={reviews.error} onRetry={() => reviews.refetch()} retrying={reviews.isFetching} />
            ) : reviews.data.content.length === 0 ? (
              <EmptyState
                icon={<Star className="h-5 w-5" />}
                title={rating ? `No ${rating}-star reviews` : direction === 'received' ? 'No reviews about you yet' : "You haven't reviewed anyone yet"}
                description={direction === 'received' ? 'Reviews from your interview partners will show up here.' : 'Reviews you write after interviews will show up here.'}
              />
            ) : (
              <div className={reviews.isPlaceholderData ? 'opacity-60 transition-opacity' : undefined}>
                <ReviewsGrid reviews={reviews.data.content} direction={direction} className="p-3 sm:p-5" />
                <Pagination
                  page={reviews.data.number}
                  totalPages={reviews.data.totalPages}
                  totalElements={reviews.data.totalElements}
                  pageSize={reviews.data.size}
                  isFetching={reviews.isFetching}
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
    </>
  )
}
