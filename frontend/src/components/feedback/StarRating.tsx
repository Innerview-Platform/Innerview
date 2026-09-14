import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

export function StarRating({ value, max = 5, size = 14, className }: { value: number; max?: number; size?: number; className?: string }) {
  const rounded = Math.round(value)
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)} role="img" aria-label={`${value.toFixed(1)} out of ${max} stars`}>
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          style={{ width: size, height: size }}
          className={i < rounded ? 'fill-warning text-warning' : 'text-border'}
          aria-hidden
        />
      ))}
    </span>
  )
}
