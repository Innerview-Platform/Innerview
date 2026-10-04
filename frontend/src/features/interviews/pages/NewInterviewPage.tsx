import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarClock, Code2, Layers, MessagesSquare, Zap, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { Alert } from '@/components/feedback/Alert'
import { FormField } from '@/components/forms/FormField'
import { TextInput } from '@/components/forms/controls'
import { PageHeader } from '@/components/layout/PageHeader'
import { INTERVIEW_TYPE_DESCRIPTIONS, INTERVIEW_TYPE_LABELS, INTERVIEW_TYPES, type InterviewType } from '@/constants/enums'
import { RoomCreatedCard } from '@/features/interviews/components/RoomCreatedCard'
import { useCreateInstantInterview, useCreateScheduledInterview } from '@/features/interviews/hooks/useInterviews'
import { createInterviewSchema, type CreateInterviewFormValues } from '@/features/interviews/validation/interviewSchemas'
import type { CreatedInterview } from '@/features/interviews/types'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { getErrorMessage } from '@/lib/apiError'
import { cn } from '@/lib/utils'

const TYPE_ICONS: Record<InterviewType, LucideIcon> = {
  PROBLEM_SOLVING: Code2,
  SYSTEM_DESIGN: Layers,
  HR: MessagesSquare,
  TECHNICAL: Zap,
}

interface CreatedState {
  interview: CreatedInterview
  type: InterviewType
  startTime?: string
}

/** Current local time formatted for a `datetime-local` input's `min`. */
function localDateTimeMin() {
  const now = new Date()
  now.setSeconds(0, 0)
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}

export default function NewInterviewPage() {
  useDocumentTitle('New interview')
  const createInstant = useCreateInstantInterview()
  const createScheduled = useCreateScheduledInterview()
  const [created, setCreated] = useState<CreatedState | null>(null)

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateInterviewFormValues>({
    resolver: zodResolver(createInterviewSchema),
    defaultValues: { mode: 'instant', interviewType: 'PROBLEM_SOLVING', startTime: '' },
  })
  const mode = useWatch({ control, name: 'mode' })
  const selectedType = useWatch({ control, name: 'interviewType' })
  const mutation = mode === 'instant' ? createInstant : createScheduled

  const onSubmit = handleSubmit(({ mode, interviewType, startTime }) => {
    if (mode === 'instant') {
      createInstant.mutate({ interviewType }, { onSuccess: (interview) => setCreated({ interview, type: interviewType }) })
    } else {
      const iso = new Date(startTime).toISOString()
      createScheduled.mutate(
        { interviewType, startTime: iso },
        { onSuccess: (interview) => setCreated({ interview, type: interviewType, startTime: iso }) },
      )
    }
  })

  if (created) {
    return (
      <>
        <PageHeader title="New interview" />
        <RoomCreatedCard
          {...created}
          onCreateAnother={() => {
            setCreated(null)
            reset()
            createInstant.reset()
            createScheduled.reset()
          }}
        />
      </>
    )
  }

  return (
    <>
      <PageHeader title="New interview" description="Open a room now or schedule one, then share the code with your peer." />

      <Card className="mx-auto max-w-3xl p-5 sm:p-7">
        <form onSubmit={onSubmit} className="space-y-7" noValidate>
          {mutation.error && <Alert tone="danger">{getErrorMessage(mutation.error)}</Alert>}

          <fieldset>
            <legend className="text-sm font-semibold">When</legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-2" role="radiogroup">
              {(
                [
                  { value: 'instant', title: 'Start now', text: 'Open a room immediately.', icon: Zap },
                  { value: 'scheduled', title: 'Schedule', text: 'Pick a date and time.', icon: CalendarClock },
                ] as const
              ).map(({ value, title, text, icon: Icon }) => (
                <label
                  key={value}
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary',
                    mode === value ? 'border-primary bg-primary/10' : 'border-border hover:border-fg-muted',
                  )}
                >
                  <input type="radio" value={value} className="sr-only" {...register('mode')} />
                  <Icon className={cn('mt-0.5 h-5 w-5', mode === value ? 'text-primary-hover' : 'text-fg-muted')} aria-hidden />
                  <span>
                    <span className="block text-sm font-medium">{title}</span>
                    <span className="block text-[13px] text-fg-muted">{text}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-semibold">Interview type</legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-2" role="radiogroup">
              {INTERVIEW_TYPES.map((type) => {
                const Icon = TYPE_ICONS[type]
                const active = selectedType === type
                return (
                  <label
                    key={type}
                    className={cn(
                      'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary',
                      active ? 'border-primary bg-primary/10' : 'border-border hover:border-fg-muted',
                    )}
                  >
                    <input type="radio" value={type} className="sr-only" {...register('interviewType')} />
                    <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', active ? 'bg-primary/20 text-primary-hover' : 'bg-elevated text-fg-muted')}>
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <span>
                      <span className="block text-sm font-medium">{INTERVIEW_TYPE_LABELS[type]}</span>
                      <span className="block text-[13px] text-fg-muted">{INTERVIEW_TYPE_DESCRIPTIONS[type]}</span>
                    </span>
                  </label>
                )
              })}
            </div>
            {errors.interviewType && <p className="mt-2 text-xs text-danger">{errors.interviewType.message}</p>}
          </fieldset>

          {mode === 'scheduled' && (
            <FormField label="Start time" error={errors.startTime?.message} hint="Shown in your local time zone.">
              {(field) => <TextInput {...field} type="datetime-local" min={localDateTimeMin()} className="sm:max-w-xs" {...register('startTime')} />}
            </FormField>
          )}

          <div className="flex justify-end border-t border-border pt-5">
            <Button type="submit" size="lg" loading={mutation.isPending}>
              {mode === 'instant' ? 'Create room' : 'Schedule interview'}
            </Button>
          </div>
        </form>
      </Card>
    </>
  )
}
