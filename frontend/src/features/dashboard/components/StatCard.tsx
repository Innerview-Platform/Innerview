import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Skeleton } from '@/components/common/Skeleton'

interface StatProps {
  label: string
  value: ReactNode
  hint?: ReactNode
  icon: LucideIcon
  loading?: boolean
}

/** One figure in the dashboard's stats strip. */
export function Stat({ label, value, hint, icon: Icon, loading }: StatProps) {
  return (
    <div className="px-5 py-4">
      <p className="flex items-center gap-1.5 text-[13px] font-medium text-fg-muted">
        <Icon className="h-3.5 w-3.5" aria-hidden />
        {label}
      </p>
      {loading ? <Skeleton className="mt-2.5 h-8 w-14" /> : <p className="mt-1.5 text-[28px] leading-tight font-semibold tracking-tight tabular-nums">{value}</p>}
      {hint && <p className="mt-0.5 text-xs text-fg-muted">{hint}</p>}
    </div>
  )
}
