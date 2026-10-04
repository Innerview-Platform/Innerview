import type { UseFormRegisterReturn } from 'react-hook-form'
import { AtSign, CheckCircle2, XCircle } from 'lucide-react'
import { Spinner } from '@/components/common/Spinner'
import { FormField } from '@/components/forms/FormField'
import { TextInput } from '@/components/forms/controls'
import type { UsernameStatus } from '@/features/profile/hooks/useUsernameAvailability'

interface UsernameFieldProps {
  registration: UseFormRegisterReturn
  status: UsernameStatus
  /** Validation error from the form (shown instead of the live status). */
  error?: string
  autoFocus?: boolean
}

/** Username input with a live "available / taken" indicator under it. */
export function UsernameField({ registration, status, error, autoFocus }: UsernameFieldProps) {
  return (
    <FormField label="Username" error={error} hint={<UsernameHint status={status} />}>
      {(field) => (
        <div className="relative">
          <AtSign className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-fg-muted" aria-hidden />
          <TextInput
            {...field}
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            autoFocus={autoFocus}
            maxLength={30}
            placeholder="jane.doe"
            className="pr-9 pl-9"
            {...registration}
          />
          <span className="absolute top-1/2 right-3 -translate-y-1/2" aria-hidden>
            {status.state === 'checking' && <Spinner size="sm" className="text-fg-muted" />}
            {(status.state === 'available' || status.state === 'unchanged') && <CheckCircle2 className="h-4 w-4 text-success" />}
            {(status.state === 'taken' || status.state === 'invalid') && <XCircle className="h-4 w-4 text-danger" />}
          </span>
        </div>
      )}
    </FormField>
  )
}

function UsernameHint({ status }: { status: UsernameStatus }) {
  // aria-live so screen readers hear the result once typing pauses.
  return (
    <span aria-live="polite">
      {status.state === 'idle' && 'Your public profile link. Letters, numbers, . _ and -'}
      {status.state === 'unchanged' && 'This is your current username.'}
      {status.state === 'checking' && 'Checking availability…'}
      {status.state === 'available' && <span className="text-success">@{status.username} is available</span>}
      {status.state === 'taken' && <span className="text-danger">{status.message}</span>}
      {status.state === 'invalid' && <span className="text-danger">{status.message}</span>}
      {status.state === 'error' && "Couldn't check availability right now."}
    </span>
  )
}
