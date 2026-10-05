import type { ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, CircleDashed, Clock, FlaskConical, Plus, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/common/Button'
import { Spinner } from '@/components/common/Spinner'
import { useCreateLanguage } from '@/features/languages/hooks/useLanguages'
import type { SubmissionStatus } from '@/features/problems/types'
import { EDITOR_LANGUAGES, type EditorLanguage } from '@/features/room/components/CollaborativeEditor'
import type { Judge } from '@/features/room/hooks/useJudge'
import { getErrorMessage } from '@/lib/apiError'
import { cn } from '@/lib/utils'

const VERDICT: Record<SubmissionStatus, { label: string; tone: 'success' | 'danger' | 'warning' | 'muted' }> = {
  ACCEPTED: { label: 'Accepted', tone: 'success' },
  WRONG_ANSWER: { label: 'Wrong answer', tone: 'danger' },
  TIME_LIMIT_EXCEEDED: { label: 'Time limit exceeded', tone: 'warning' },
  MEMORY_LIMIT_EXCEEDED: { label: 'Memory limit exceeded', tone: 'warning' },
  COMPILE_ERROR: { label: 'Compilation error', tone: 'danger' },
  RUNTIME_ERROR: { label: 'Runtime error', tone: 'danger' },
  SKIPPED: { label: 'Skipped', tone: 'muted' },
  PENDING: { label: 'Queued', tone: 'muted' },
  RUNNING: { label: 'Running', tone: 'muted' },
}

const TONE_CLASS = { success: 'text-success', danger: 'text-danger', warning: 'text-warning', muted: 'text-fg-muted' }

function VerdictIcon({ status, className }: { status: SubmissionStatus; className?: string }) {
  const tone = VERDICT[status]?.tone ?? 'muted'
  const Icon = status === 'ACCEPTED' ? CheckCircle2 : tone === 'warning' ? Clock : tone === 'muted' ? CircleDashed : XCircle
  return <Icon className={cn('h-4 w-4 shrink-0', TONE_CLASS[tone], className)} aria-hidden />
}

const ms = (value: number | null | undefined) => (value == null ? '' : value >= 1000 ? `${(value / 1000).toFixed(2)} s` : `${value} ms`)

/** Offers to add the editor language to the shared catalog (the judge only accepts catalog languages). */
function AddLanguage({ language }: { language: EditorLanguage }) {
  const create = useCreateLanguage()
  return (
    <Button
      size="sm"
      variant="secondary"
      leftIcon={<Plus className="h-3.5 w-3.5" />}
      loading={create.isPending}
      onClick={() =>
        create.mutate(language, {
          onSuccess: () => toast.success(`${EDITOR_LANGUAGES[language].label} added to the language catalog`),
          onError: (error) => toast.error("Couldn't add the language", { description: getErrorMessage(error) }),
        })
      }
    >
      Add “{language}” to the catalog
    </Button>
  )
}

/** Run-samples and submission results, in the editor's bottom panel next to the terminal. */
export function JudgeResults({ judge, language, headerStart }: { judge: Judge; language: EditorLanguage; headerStart: ReactNode }) {
  const { state, judgeLanguage, catalogLoading } = judge
  const result = state?.result
  const total = result?.testResults.length ?? 0
  const passed = result?.testResults.filter((t) => t.status === 'ACCEPTED').length ?? 0
  const final = state?.phase === 'done' && result
  const verdict = result ? VERDICT[result.status] : null

  let body: ReactNode
  if (!judgeLanguage && !catalogLoading) {
    body = (
      <div className="flex flex-col items-start gap-3">
        <p className="flex items-center gap-2 text-[13px] text-fg-secondary">
          <AlertTriangle className="h-4 w-4 text-warning" aria-hidden />
          {EDITOR_LANGUAGES[language].label} isn’t in the judge’s language catalog yet, so solutions in it can’t be judged.
        </p>
        <AddLanguage language={language} />
      </div>
    )
  } else if (!state) {
    body = (
      <div className="flex items-start gap-3 text-[13px] text-fg-muted">
        <FlaskConical className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <p>
          <span className="font-medium text-fg-secondary">Run samples</span> checks your code against the example cases.{' '}
          <span className="font-medium text-fg-secondary">Submit</span> judges it against every test case, including hidden ones. Results are visible only to you.
        </p>
      </div>
    )
  } else if (state.phase === 'error') {
    body = (
      <div className="space-y-3">
        <p className="flex items-start gap-2 text-[13px] text-danger" role="alert">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {state.error}
        </p>
        {state.supportedLanguages && <p className="text-xs text-fg-muted">Languages the judge accepts: {state.supportedLanguages.join(', ') || 'none yet'}.</p>}
      </div>
    )
  } else {
    body = (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2" aria-live="polite">
          {final && verdict ? (
            <p className={cn('flex items-center gap-2 text-[15px] font-semibold', TONE_CLASS[verdict.tone])}>
              <VerdictIcon status={result.status} className="h-5 w-5" />
              {verdict.label}
            </p>
          ) : (
            <p className="flex items-center gap-2 text-[13px] font-medium text-fg-secondary">
              <Spinner size="sm" className="text-primary" />
              {state.phase === 'judging' ? 'Judging your solution…' : state.kind === 'samples' ? 'Running the samples…' : 'Submitting…'}
            </p>
          )}
          {final && total > 0 && (
            <span className="text-[13px] text-fg-secondary">
              <span className="font-semibold text-fg tabular-nums">
                {passed}/{total}
              </span>{' '}
              {state.kind === 'samples' ? 'samples' : 'tests'} passed
            </span>
          )}
          {final && result.score != null && state.kind === 'submission' && (
            <span className="text-[13px] text-fg-secondary">
              Score <span className="font-semibold text-fg tabular-nums">{result.score}</span>/100
            </span>
          )}
          {final && result.totalDurationMs != null && <span className="text-xs text-fg-muted tabular-nums">{ms(result.totalDurationMs)} total</span>}
        </div>
        {final && total === 0 && <p className="text-[13px] text-fg-muted">{state.kind === 'samples' ? 'This problem has no sample cases.' : 'This problem has no test cases yet.'}</p>}
        {total > 0 && (
          <ol className="grid gap-1.5 sm:grid-cols-2 xl:grid-cols-3">
            {result!.testResults.map((test) => (
              <li key={test.testIndex} className="flex items-center gap-2 rounded-md border border-border-subtle bg-surface px-2.5 py-1.5 text-[12.5px]">
                <VerdictIcon status={test.status} />
                <span className="font-medium">
                  {state.kind === 'samples' ? 'Sample' : 'Test'} {test.testIndex + 1}
                </span>
                <span className={cn('min-w-0 flex-1 truncate', TONE_CLASS[VERDICT[test.status]?.tone ?? 'muted'])}>{VERDICT[test.status]?.label ?? test.status}</span>
                <span className="text-fg-muted tabular-nums">{ms(test.durationMs)}</span>
              </li>
            ))}
          </ol>
        )}
        {final && result.status !== 'ACCEPTED' && total > 0 && (
          <p className="text-[11.5px] text-fg-muted">The judge reports a verdict per test, not program output. Use Run to see what your code prints.</p>
        )}
      </div>
    )
  }

  return (
    <section className="flex h-full min-h-0 flex-col bg-bg" aria-label="Test results">
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-1.5">
        <div className="flex min-w-0 items-center gap-2">{headerStart}</div>
        {state && !judge.busy && (
          <Button variant="ghost" size="sm" className="h-7 px-2" onClick={judge.dismiss}>
            Clear
          </Button>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-auto px-3 py-3">{body}</div>
    </section>
  )
}
