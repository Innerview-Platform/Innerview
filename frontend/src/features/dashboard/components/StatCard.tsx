import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Card } from '@/components/common/Card'
import { Skeleton } from '@/components/common/Skeleton'

interface StatCardProps {
  label: string
  value: ReactNode
  hint?: ReactNode
  icon: LucideIcon
  loading?: boolean
}

export function StatCard({ label, value, hint, icon: Icon, loading }: StatCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-fg-muted">{label}</p>
        <Icon className="h-4 w-4 text-fg-muted" aria-hidden />
      </div>
      {loading ? <Skeleton className="mt-3 h-8 w-16" /> : <p className="mt-2 text-[28px] leading-tight font-bold tracking-tight">{value}</p>}
      {hint && <p className="mt-1 text-xs text-fg-muted">{hint}</p>}
    </Card>
  )
}
