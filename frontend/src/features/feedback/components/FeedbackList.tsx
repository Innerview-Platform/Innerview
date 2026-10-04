import { MessageSquareQuote } from 'lucide-react'
import { StarRating } from '@/components/feedback/StarRating'
import type { FeedbackItem } from '@/features/feedback/api/feedbackApi'
import type { FeedbackDirection } from '@/features/feedback/hooks/useFeedback'
import { formatDate, shortId } from '@/lib/utils'

interface FeedbackListProps {
  items: FeedbackItem[]
  direction: FeedbackDirection
}

export function FeedbackList({ items, direction }: FeedbackListProps) {
  return (
    <ul className="divide-y divide-border-subtle">
      {items.map((item, index) => (
        <li key={`${item.interview_id}-${item.reviewer_id}-${index}`} className="px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <StarRating value={item.rating} />
              <span className="text-sm font-medium">{item.rating}/5</span>
            </div>
            <span className="text-xs text-fg-muted">{formatDate(item.created_at)}</span>
          </div>
          {item.comment ? (
            <p className="mt-2.5 flex gap-2 text-sm leading-relaxed text-fg-secondary">
              <MessageSquareQuote className="mt-0.5 h-4 w-4 shrink-0 text-fg-muted" aria-hidden />
              <span className="whitespace-pre-line">{item.comment}</span>
            </p>
          ) : (
            <p className="mt-2.5 text-sm text-fg-muted italic">No written comment.</p>
          )}
          <p className="mt-2.5 font-mono text-xs text-fg-muted">
            Interview #{item.interview_id} · {direction === 'received' ? 'from' : 'for'} user {shortId(item.reviewer_id)}
          </p>
        </li>
      ))}
    </ul>
  )
}
