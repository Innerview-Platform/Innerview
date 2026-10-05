import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/common/Button'
import { FormField } from '@/components/forms/FormField'
import { Select, Textarea, TextInput } from '@/components/forms/controls'
import { Modal } from '@/components/modals/Modal'
import { useLanguageCatalog } from '@/features/languages/hooks/useLanguages'
import { useProblemMutations } from '@/features/problems/hooks/useProblems'
import { DIFFICULTIES, DIFFICULTY_LABELS, type OwnedProblem, type Problem, type ProblemPayload } from '@/features/problems/types'
import { getErrorMessage } from '@/lib/apiError'
import { cn } from '@/lib/utils'
import { paths } from '@/routes/paths'

const optionalPositive = z
  .string()
  .trim()
  .refine((v) => v === '' || (/^\d+$/.test(v) && Number(v) > 0), 'Use a whole number above 0')

const schema = z.object({
  title: z.string().trim().min(3, 'Give it a title (3+ characters)').max(150, 'Keep the title under 150 characters'),
  difficulty: z.enum(DIFFICULTIES),
  tags: z.string(),
  statement: z.string().trim().min(10, 'Describe the problem (10+ characters)'),
  timeLimitMs: optionalPositive,
  memoryLimitMb: optionalPositive,
  solutionLanguageId: z.string(),
  solutionCode: z.string(),
})
type Values = z.infer<typeof schema>

const parseTags = (raw: string) => [...new Set(raw.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean))].slice(0, 10)

interface ProblemFormModalProps {
  open: boolean
  onClose: () => void
  /** Editing: the problem (with its solution when it came from "My problems"). */
  problem?: Problem | OwnedProblem | null
  onSaved?: (problem: OwnedProblem) => void
}

/** Create or edit a problem. Test cases are managed on the problem's page once it exists. */
export function ProblemFormModal({ open, onClose, problem, onSaved }: ProblemFormModalProps) {
  const editing = Boolean(problem)
  const owned = problem && 'solutionLanguage' in problem ? (problem as OwnedProblem) : null
  const catalog = useLanguageCatalog()
  const { create, update } = useProblemMutations()
  const saving = create.isPending || update.isPending

  const { register, handleSubmit, control, reset, setError, formState: { errors } } = useForm<Values>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (!open) return
    reset({
      title: problem?.title ?? '',
      difficulty: problem?.difficulty ?? 'EASY',
      tags: problem?.tags?.join(', ') ?? '',
      statement: problem?.statement ?? '',
      timeLimitMs: problem?.timeLimitMs ? String(problem.timeLimitMs) : '',
      memoryLimitMb: problem?.memoryLimitMb ? String(problem.memoryLimitMb) : '',
      solutionLanguageId: owned?.solutionLanguage?.id ?? '',
      solutionCode: owned?.solutionCode ?? '',
    })
  }, [open, problem, owned, reset])

  const onSubmit = handleSubmit((values) => {
    // The backend rejects new problems without a solution language.
    if (!editing && !values.solutionLanguageId) {
      setError('solutionLanguageId', { message: 'Choose the language of your reference solution' })
      return
    }
    const payload: Partial<ProblemPayload> = {
      title: values.title.trim(),
      difficulty: values.difficulty,
      tags: parseTags(values.tags),
      statement: values.statement.trim(),
      timeLimitMs: values.timeLimitMs ? Number(values.timeLimitMs) : undefined,
      memoryLimitMb: values.memoryLimitMb ? Number(values.memoryLimitMb) : undefined,
      // Empty fields are left unchanged when editing.
      solutionCode: values.solutionCode.trim() ? values.solutionCode : undefined,
      solutionLanguage: values.solutionLanguageId ? { id: values.solutionLanguageId } : undefined,
    }
    const done = (saved: OwnedProblem) => {
      toast.success(editing ? 'Problem updated' : 'Your problem has been created', {
        description: editing ? undefined : 'Add test cases so solutions can be judged.',
      })
      onSaved?.(saved)
      onClose()
    }
    const fail = (error: unknown) => toast.error(editing ? "Couldn't save the problem" : "Couldn't create the problem", { description: getErrorMessage(error) })
    if (problem) update.mutate({ id: problem.id, payload }, { onSuccess: done, onError: fail })
    else create.mutate(payload as ProblemPayload, { onSuccess: done, onError: fail })
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      dismissible={!saving}
      title={editing ? 'Edit problem' : 'New problem'}
      description={editing ? undefined : 'Write the statement candidates will see. You can add test cases right after.'}
      className="max-w-2xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="problem-form" loading={saving}>
            {editing ? 'Save changes' : 'Create problem'}
          </Button>
        </>
      }
    >
      <form id="problem-form" onSubmit={onSubmit} className="space-y-5" noValidate>
        <FormField label="Title" error={errors.title?.message}>
          {(field) => <TextInput {...field} placeholder="e.g. Merge overlapping intervals" data-autofocus {...register('title')} />}
        </FormField>

        <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
          <fieldset>
            <legend className="mb-1.5 text-[13px] font-medium text-fg-secondary">Difficulty</legend>
            <Controller
              control={control}
              name="difficulty"
              render={({ field }) => (
                <div role="radiogroup" aria-label="Difficulty" className="flex gap-0.5 rounded-lg border border-border bg-bg p-0.5">
                  {DIFFICULTIES.map((d) => (
                    <button
                      key={d}
                      type="button"
                      role="radio"
                      aria-checked={field.value === d}
                      onClick={() => field.onChange(d)}
                      className={cn(
                        'h-8 rounded-md px-3 text-[13px] font-medium transition-colors',
                        field.value === d ? 'bg-surface text-fg shadow-sm' : 'text-fg-muted hover:text-fg',
                      )}
                    >
                      {DIFFICULTY_LABELS[d]}
                    </button>
                  ))}
                </div>
              )}
            />
          </fieldset>
          <FormField label="Topics" optional hint="Comma-separated, e.g. arrays, two pointers">
            {(field) => <TextInput {...field} placeholder="arrays, sorting" {...register('tags')} />}
          </FormField>
        </div>

        <FormField label="Statement" error={errors.statement?.message} hint="Plain text or Markdown. Include input/output format and constraints.">
          {(field) => <Textarea {...field} rows={9} className="font-mono text-[13px]" placeholder={'Given an array of intervals…\n\nInput: …\nOutput: …\n\nConstraints:\n- …'} {...register('statement')} />}
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Time limit (ms)" optional error={errors.timeLimitMs?.message}>
            {(field) => <TextInput {...field} inputMode="numeric" placeholder="2000" {...register('timeLimitMs')} />}
          </FormField>
          <FormField label="Memory limit (MB)" optional error={errors.memoryLimitMb?.message}>
            {(field) => <TextInput {...field} inputMode="numeric" placeholder="256" {...register('memoryLimitMb')} />}
          </FormField>
        </div>

        <fieldset className="space-y-4 rounded-lg border border-border-subtle bg-bg/40 p-4">
          <legend className="px-1 text-[13px] font-medium text-fg-secondary">Reference solution</legend>
          <FormField
            label="Language"
            error={errors.solutionLanguageId?.message}
            hint={
              catalog.data?.length === 0 ? (
                <>
                  The language catalog is empty — add one under <Link to={paths.settings} className="text-primary hover:underline">Settings</Link>.
                </>
              ) : editing && !owned ? (
                'Leave as is to keep the current language.'
              ) : undefined
            }
          >
            {(field) => (
              <Select {...field} disabled={catalog.isPending} {...register('solutionLanguageId')}>
                <option value="">{catalog.isPending ? 'Loading…' : editing && !owned ? 'Keep current' : 'Choose a language…'}</option>
                {catalog.data?.map((language) => (
                  <option key={language.id} value={language.id}>
                    {language.name}
                  </option>
                ))}
              </Select>
            )}
          </FormField>
          <FormField label="Code" optional hint={editing && !owned ? 'Leave empty to keep the current solution.' : 'Only you can see it.'}>
            {(field) => <Textarea {...field} rows={6} spellCheck={false} className="font-mono text-[13px]" placeholder="def solve(): …" {...register('solutionCode')} />}
          </FormField>
        </fieldset>
      </form>
    </Modal>
  )
}
