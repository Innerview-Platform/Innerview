import type { ReactNode } from 'react'
import { AlertCircle, Inbox, RotateCw } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { Spinner } from '@/components/common/Spinner'
import { getErrorMessage } from '@/lib/apiError'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: ReactNode
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-12 text-center', className)}>
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-elevated text-fg-muted">
        {icon ?? <Inbox className="h-5 w-5" />}
      </div>
      <h3 className="text-[15px] font-semibold text-fg">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-fg-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

interface ErrorStateProps {
  error: unknown
  title?: string
  onRetry?: () => void
  retrying?: boolean
  className?: string
}

export function ErrorState({ error, title = "Couldn't load this", onRetry, retrying, className }: ErrorStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-12 text-center', className)} role="alert">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-danger/30 bg-danger/10 text-danger">
        <AlertCircle className="h-5 w-5" />
      </div>
      <h3 className="text-[15px] font-semibold text-fg">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-fg-muted">{getErrorMessage(error)}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-5" onClick={onRetry} loading={retrying} leftIcon={<RotateCw className="h-3.5 w-3.5" />}>
          Try again
        </Button>
      )}
    </div>
  )
}

export function PageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] w-full flex-col items-center justify-center gap-3 text-fg-muted">
      <Spinner size="lg" className="text-primary" />
      <span className="text-sm">{label}</span>
    </div>
  )
}
