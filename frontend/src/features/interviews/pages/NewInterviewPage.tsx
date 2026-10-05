import { useState } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarClock, Code2, Layers, MessagesSquare, Plus, Trash2, User, Users, Zap, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { Alert } from '@/components/feedback/Alert'
import { FormField } from '@/components/forms/FormField'
import { Select, TextInput } from '@/components/forms/controls'
import { PageHeader } from '@/components/layout/PageHeader'
import { INTERVIEW_TYPE_DESCRIPTIONS, INTERVIEW_TYPE_LABELS, INTERVIEW_TYPES, type InterviewType } from '@/constants/enums'
import { ProblemPicker } from '@/features/problems/components/ProblemPicker'
import type { Problem } from '@/features/problems/types'
import { RoomCreatedCard } from '@/features/interviews/components/RoomCreatedCard'
import { useCreateInstantInterview, useCreateScheduledInterview } from '@/features/interviews/hooks/useInterviews'
import { createInterviewSchema, type CreateInterviewFormValues } from '@/features/interviews/validation/interviewSchemas'
import type { CreatedInterview } from '@/features/interviews/types'
import type { AccessPolicy, RoomRole } from '@/features/room/types'
import { ACCESS_POLICY_LABELS, ROOM_ROLE_LABELS } from '@/features/room/utils/labels'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { getErrorMessage } from '@/lib/apiError'
import { cn } from '@/lib/utils'

const TYPE_ICONS: Record<InterviewType, LucideIcon> = {
  PROBLEM_SOLVING: Code2,
  SYSTEM_DESIGN: Layers,
  HR: MessagesSquare,
  TECHNICAL: Zap,
}

const ROOM_SIZE_OPTIONS = [
  { value: 'ONE_ON_ONE', title: 'One-on-one', text: 'You and one peer (2 participants).', icon: User },
  { value: 'MANY', title: 'Group', text: 'No participant limit, e.g. panel interviews.', icon: Users },
] as const

interface CreatedState {
  interview: CreatedInterview
  type: InterviewType
  startTime?: string
  problems: Problem[]
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
  // Optional problems from the library, sent as `problemIds` (the room can then judge submissions for them).
  const [problems, setProblems] = useState<Problem[]>([])

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateInterviewFormValues>({
    resolver: zodResolver(createInterviewSchema),
    defaultValues: { mode: 'instant', interviewType: 'PROBLEM_SOLVING', roomSize: 'ONE_ON_ONE', startTime: '', title: '', ownerRole: 'INTERVIEWER', accessPolicy: 'ASK_TO_JOIN', invitees: [] },
  })
  const mode = useWatch({ control, name: 'mode' })
  const selectedType = useWatch({ control, name: 'interviewType' })
  const selectedSize = useWatch({ control, name: 'roomSize' })
  const selectedPolicy = useWatch({ control, name: 'accessPolicy' }) as AccessPolicy
  const invitees = useFieldArray({ control, name: 'invitees' })
  const mutation = mode === 'instant' ? createInstant : createScheduled

  const onSubmit = handleSubmit(({ mode, interviewType, roomSize, startTime, title, ownerRole, accessPolicy, invitees: people }) => {
    const payload = {
      interviewType,
      roomSize,
      creatorInterviewRole: ownerRole,
      title: title.trim() || undefined,
      accessPolicy,
      invitees: people.filter((p) => p.email.trim()).map((p) => ({ email: p.email.trim(), role: p.role })),
      problemIds: problems.length ? problems.map((p) => p.id) : undefined,
    }
    if (mode === 'instant') {
      createInstant.mutate(payload, { onSuccess: (interview) => setCreated({ interview, type: interviewType, problems }) })
    } else {
      const iso = new Date(startTime).toISOString()
      createScheduled.mutate(
        { ...payload, startTime: iso },
        { onSuccess: (interview) => setCreated({ interview, type: interviewType, startTime: iso, problems }) },
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
            setProblems([])
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

          {selectedType !== 'HR' && (
            <fieldset>
              <legend className="flex w-full items-baseline justify-between text-sm font-semibold">
                Problems <span className="text-xs font-normal text-fg-muted">Optional</span>
              </legend>
              <p className="mt-1 mb-3 text-[13px] text-fg-muted">
                Attach problems from the library. In the room, the interviewer loads one into the shared problem and the candidate can submit against its test cases.
              </p>
              <ProblemPicker value={problems} onChange={setProblems} />
            </fieldset>
          )}

          <fieldset>
            <legend className="text-sm font-semibold">Room size</legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-2" role="radiogroup">
              {ROOM_SIZE_OPTIONS.map(({ value, title, text, icon: Icon }) => (
                <label
                  key={value}
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary',
                    selectedSize === value ? 'border-primary bg-primary/10' : 'border-border hover:border-fg-muted',
                  )}
                >
                  <input type="radio" value={value} className="sr-only" {...register('roomSize')} />
                  <Icon className={cn('mt-0.5 h-5 w-5', selectedSize === value ? 'text-primary-hover' : 'text-fg-muted')} aria-hidden />
                  <span>
                    <span className="block text-sm font-medium">{title}</span>
                    <span className="block text-[13px] text-fg-muted">{text}</span>
                  </span>
                </label>
              ))}
            </div>
            {errors.roomSize && <p className="mt-2 text-xs text-danger">{errors.roomSize.message}</p>}
          </fieldset>

          <FormField label="Title (optional)" error={errors.title?.message} hint="Shown in invites, the room header and your history.">
            {(field) => <TextInput {...field} placeholder="e.g. Mock system design — URL shortener" {...register('title')} />}
          </FormField>

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Your role" hint="You're the host either way.">
              {(field) => (
                <Select {...field} {...register('ownerRole')}>
                  <option value="INTERVIEWER">Interviewer — I'll run the interview</option>
                  <option value="INTERVIEWEE">Candidate — I want to practise</option>
                </Select>
              )}
            </FormField>
            <FormField label="Who can join" hint={ACCESS_POLICY_LABELS[selectedPolicy].hint}>
              {(field) => (
                <Select {...field} {...register('accessPolicy')}>
                  {(Object.keys(ACCESS_POLICY_LABELS) as AccessPolicy[]).map((policy) => (
                    <option key={policy} value={policy}>
                      {ACCESS_POLICY_LABELS[policy].label}
                    </option>
                  ))}
                </Select>
              )}
            </FormField>
          </div>

          <fieldset>
            <legend className="text-sm font-semibold">Invite people</legend>
            <p className="mt-1 text-[13px] text-fg-muted">They get an email with the link and a calendar entry, and join without waiting in the lobby.</p>
            <div className="mt-3 space-y-2">
              {invitees.fields.map((row, index) => (
                <div key={row.id} className="flex flex-col gap-2 sm:flex-row sm:items-start">
                  <div className="flex-1">
                    <TextInput type="email" placeholder="name@example.com" aria-label={`Invitee ${index + 1} email`} aria-invalid={Boolean(errors.invitees?.[index]?.email)} {...register(`invitees.${index}.email`)} />
                    {errors.invitees?.[index]?.email && <p className="mt-1 text-xs text-danger">{errors.invitees[index]?.email?.message}</p>}
                  </div>
                  <Select className="sm:w-44" aria-label={`Invitee ${index + 1} role`} {...register(`invitees.${index}.role`)}>
                    {(Object.keys(ROOM_ROLE_LABELS) as RoomRole[]).map((role) => (
                      <option key={role} value={role}>
                        {ROOM_ROLE_LABELS[role]}
                      </option>
                    ))}
                  </Select>
                  <Button variant="ghost" size="icon" aria-label="Remove invitee" onClick={() => invitees.remove(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button variant="secondary" size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => invitees.append({ email: '', role: 'INTERVIEWEE' })}>
                Add person
              </Button>
            </div>
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
