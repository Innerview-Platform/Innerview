import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RoomNoticeProps {
  icon: LucideIcon
  title: string
  description: ReactNode
  action?: ReactNode
  className?: string
}

export function RoomNotice({ icon: Icon, title, description, action, className }: RoomNoticeProps) {
  return (
    <section className={cn('flex items-start gap-3 rounded-xl border border-border bg-surface px-4 py-3', className)}>
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-elevated text-fg-muted">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="mt-0.5 text-[13px] text-fg-muted">{description}</p>
      </div>
      {action && <div className="shrink-0 self-center">{action}</div>}
    </section>
  )
}
