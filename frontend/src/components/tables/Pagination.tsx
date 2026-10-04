import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/common/Button'

interface PaginationProps {
  /** Zero-based page index, as returned by Spring. */
  page: number
  totalPages: number
  totalElements: number
  pageSize: number
  onPageChange: (page: number) => void
  isFetching?: boolean
}

export function Pagination({ page, totalPages, totalElements, pageSize, onPageChange, isFetching }: PaginationProps) {
  if (totalElements === 0) return null
  const from = page * pageSize + 1
  const to = Math.min((page + 1) * pageSize, totalElements)

  return (
    <nav className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3" aria-label="Pagination">
      <p className="text-[13px] text-fg-muted">
        Showing <span className="font-medium text-fg-secondary">{from}</span>–<span className="font-medium text-fg-secondary">{to}</span> of{' '}
        <span className="font-medium text-fg-secondary">{totalElements}</span>
      </p>
      <div className="flex items-center gap-2">
        <span className="text-[13px] text-fg-muted">
          Page {page + 1} of {Math.max(totalPages, 1)}
        </span>
        <Button
          variant="secondary"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 0 || isFetching}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(page + 1)}
          disabled={page + 1 >= totalPages || isFetching}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  )
}
