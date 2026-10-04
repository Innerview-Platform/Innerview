import { useId, type ReactElement, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface FieldControlProps {
  id: string
  'aria-invalid'?: boolean
  'aria-describedby'?: string
}

interface FormFieldProps {
  label: ReactNode
  error?: string
  hint?: ReactNode
  optional?: boolean
  className?: string
  /** Receives the accessibility props that link the control to its label and messages. */
  children: (control: FieldControlProps) => ReactElement
}

export function FormField({ label, error, hint, optional, className, children }: FormFieldProps) {
  const id = useId()
  const messageId = `${id}-message`
  const hasMessage = Boolean(error || hint)

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="flex items-center justify-between text-[13px] font-medium text-fg-secondary">
        <span>{label}</span>
        {optional && <span className="text-xs font-normal text-fg-muted">Optional</span>}
      </label>
      {children({
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': hasMessage ? messageId : undefined,
      })}
      {hasMessage && (
        <p id={messageId} className={cn('text-xs', error ? 'text-danger' : 'text-fg-muted')} role={error ? 'alert' : undefined}>
          {error ?? hint}
        </p>
      )}
    </div>
  )
}
