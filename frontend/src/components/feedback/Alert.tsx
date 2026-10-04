import type { ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type AlertTone = 'info' | 'success' | 'warning' | 'danger'

const tones: Record<AlertTone, { className: string; Icon: typeof Info }> = {
  info: { className: 'border-primary/30 bg-primary/10 text-primary-hover', Icon: Info },
  success: { className: 'border-success/30 bg-success/10 text-success', Icon: CheckCircle2 },
  warning: { className: 'border-warning/30 bg-warning/10 text-warning', Icon: AlertTriangle },
  danger: { className: 'border-danger/30 bg-danger/10 text-danger', Icon: XCircle },
}

interface AlertProps {
  tone?: AlertTone
  title?: ReactNode
  children?: ReactNode
  action?: ReactNode
  className?: string
}

export function Alert({ tone = 'info', title, children, action, className }: AlertProps) {
  const { className: toneClass, Icon } = tones[tone]
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn('flex items-start gap-3 rounded-lg border px-3.5 py-3 text-sm', toneClass, className)}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        {title && <p className="font-medium">{title}</p>}
        {children && <div className={cn('text-fg-secondary', title && 'mt-0.5')}>{children}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
