import { useState } from 'react'
import type { ReviewDirection, ReviewSummary } from '@/features/feedback/api/reviewsApi'
import { ReviewCard } from '@/features/feedback/components/ReviewCard'
import { ReviewDetailModal } from '@/features/feedback/components/ReviewDetailModal'
import { cn } from '@/lib/utils'

interface ReviewsGridProps {
  reviews: ReviewSummary[]
  direction: ReviewDirection
  className?: string
}

/** Review cards in a responsive grid; clicking one opens its details. */
export function ReviewsGrid({ reviews, direction, className }: ReviewsGridProps) {
  const [openId, setOpenId] = useState<number | null>(null)
  return (
    <>
      <ul className={cn('grid gap-3 sm:grid-cols-2 xl:grid-cols-3', className)}>
        {reviews.map((review) => (
          <li key={review.id}>
            <ReviewCard review={review} direction={direction} onOpen={() => setOpenId(review.id)} />
          </li>
        ))}
      </ul>
      <ReviewDetailModal reviewId={openId} direction={direction} onClose={() => setOpenId(null)} />
    </>
  )
}
