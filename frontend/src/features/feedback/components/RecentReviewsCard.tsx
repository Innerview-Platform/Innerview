import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Star } from 'lucide-react'
import { buttonClasses } from '@/components/common/Button'
import { Card, CardHeader } from '@/components/common/Card'
import { SkeletonRows } from '@/components/common/Skeleton'
import { EmptyState, ErrorState } from '@/components/feedback/states'
import { ReviewsGrid } from '@/features/feedback/components/ReviewsGrid'
import { useReviews } from '@/features/feedback/hooks/useReviews'
import { paths } from '@/routes/paths'

interface RecentReviewsCardProps {
  title: string
  description?: ReactNode
  limit?: number
  gridClassName?: string
}

/** The latest reviews about you, with a link to all of them. */
export function RecentReviewsCard({ title, description, limit = 3, gridClassName }: RecentReviewsCardProps) {
  const reviews = useReviews('received', { page: 0, size: limit })
  return (
    <Card>
      <CardHeader
        title={title}
        description={description}
        action={
          <Link to={paths.feedback} className={buttonClasses({ variant: 'ghost', size: 'sm' })}>
            View all
          </Link>
        }
      />
      {reviews.isPending ? (
        <SkeletonRows rows={2} className="p-5" />
      ) : reviews.isError ? (
        <ErrorState error={reviews.error} onRetry={() => reviews.refetch()} />
      ) : reviews.data.content.length === 0 ? (
        <EmptyState icon={<Star className="h-5 w-5" />} title="No reviews yet" description="Reviews from your interview partners will show up here." />
      ) : (
        <ReviewsGrid reviews={reviews.data.content} direction="received" className={gridClassName ?? 'p-3 sm:p-5'} />
      )}
    </Card>
  )
}
