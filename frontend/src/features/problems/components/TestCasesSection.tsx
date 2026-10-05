import { useState, type FormEvent } from 'react'
import { Eye, EyeOff, FlaskConical, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { Card, CardHeader } from '@/components/common/Card'
import { SkeletonRows } from '@/components/common/Skeleton'
import { EmptyState, ErrorState } from '@/components/feedback/states'
import { TextInput, Textarea } from '@/components/forms/controls'
import { ConfirmDialog } from '@/components/modals/ConfirmDialog'
import { useTestCaseMutations, useTestCases } from '@/features/problems/hooks/useProblems'
import type { TestCase, TestCasePayload } from '@/features/problems/types'
import { getErrorMessage } from '@/lib/apiError'

const MAX_CASES = 100

function IoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="mb-1 text-[11px] font-medium tracking-wide text-fg-muted uppercase">{label}</p>
      <pre className="max-h-40 overflow-auto rounded-md border border-border-subtle bg-bg px-3 py-2 font-mono text-[12.5px] leading-relaxed whitespace-pre-wrap break-words">
        {value || <span className="text-fg-muted italic">(empty)</span>}
      </pre>
    </div>
  )
}

const EMPTY: TestCasePayload = { input: '', expectedOutput: '', sample: false, description: '', weight: 1 }

function TestCaseForm({ initial, busy, onCancel, onSave }: { initial: TestCasePayload; busy: boolean; onCancel: () => void; onSave: (payload: TestCasePayload) => void }) {
  const [draft, setDraft] = useState(initial)
  const [error, setError] = useState<string | null>(null)
  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!draft.expectedOutput.trim()) return setError('Expected output is required')
    const weight = Number(draft.weight)
    if (!Number.isInteger(weight) || weight < 1) return setError('Weight must be a whole number above 0')
    onSave({ ...draft, description: draft.description?.trim() || null, weight })
  }
  return (
    <form onSubmit={onSubmit} className="space-y-3 border-t border-border bg-bg/40 px-5 py-4" noValidate>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-fg-secondary">Input (stdin)</span>
          <Textarea rows={4} spellCheck={false} className="font-mono text-[13px]" value={draft.input} onChange={(e) => setDraft({ ...draft, input: e.target.value })} data-autofocus />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-fg-secondary">Expected output</span>
          <Textarea rows={4} spellCheck={false} className="font-mono text-[13px]" value={draft.expectedOutput} onChange={(e) => setDraft({ ...draft, expectedOutput: e.target.value })} aria-invalid={Boolean(error) || undefined} />
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_7rem]">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-fg-secondary">Note (optional)</span>
          <TextInput value={draft.description ?? ''} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="e.g. empty array" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-fg-secondary">Weight</span>
          <TextInput inputMode="numeric" value={String(draft.weight ?? '')} onChange={(e) => setDraft({ ...draft, weight: e.target.value === '' ? null : Number(e.target.value) })} />
        </label>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" className="h-4 w-4 accent-[var(--color-primary)]" checked={draft.sample} onChange={(e) => setDraft({ ...draft, sample: e.target.checked })} />
          Sample — visible to everyone and used by “Run samples”
        </label>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" size="sm" loading={busy}>
            Save test case
          </Button>
        </div>
      </div>
      {error && (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      )}
    </form>
  )
}

/** Test cases. Owners see and manage all of them; everyone else sees the samples (the backend hides the rest). */
export function TestCasesSection({ problemId, owner }: { problemId: string; owner: boolean }) {
  const cases = useTestCases(problemId)
  const mutations = useTestCaseMutations(problemId)
  const [editing, setEditing] = useState<TestCase | 'new' | null>(null)
  const [removing, setRemoving] = useState<TestCase | null>(null)
  const list = cases.data ?? []
  const hidden = list.filter((c) => !c.sample).length

  const save = (payload: TestCasePayload) => {
    const onSuccess = () => {
      toast.success(editing === 'new' ? 'Test case added' : 'Test case updated')
      setEditing(null)
    }
    const onError = (error: unknown) => toast.error("Couldn't save the test case", { description: getErrorMessage(error) })
    if (editing === 'new') mutations.add.mutate(payload, { onSuccess, onError })
    else if (editing) mutations.update.mutate({ id: editing.id, payload }, { onSuccess, onError })
  }

  return (
    <Card>
      <CardHeader
        title={owner ? 'Test cases' : 'Examples'}
        description={
          owner
            ? `${list.length} total${hidden ? ` · ${hidden} hidden from candidates` : ''}. Submissions are scored by weight.`
            : 'Sample cases. Submissions are also judged on hidden cases.'
        }
        action={
          owner && editing !== 'new' ? (
            <Button size="sm" variant="secondary" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setEditing('new')} disabled={list.length >= MAX_CASES}>
              Add test case
            </Button>
          ) : undefined
        }
      />
      {editing === 'new' && <TestCaseForm initial={{ ...EMPTY, sample: list.length === 0 }} busy={mutations.add.isPending} onCancel={() => setEditing(null)} onSave={save} />}
      {cases.isPending ? (
        <SkeletonRows rows={2} className="p-5" />
      ) : cases.isError ? (
        <ErrorState error={cases.error} title="Couldn't load test cases" onRetry={() => cases.refetch()} retrying={cases.isFetching} />
      ) : list.length === 0 ? (
        editing !== 'new' && (
          <EmptyState
            icon={<FlaskConical className="h-5 w-5" />}
            title={owner ? 'No test cases yet' : 'No examples'}
            description={owner ? 'Add at least one sample and a few hidden cases so solutions can be judged.' : "The author hasn't shared sample cases."}
          />
        )
      ) : (
        <ol className="divide-y divide-border-subtle">
          {list.map((testCase, index) =>
            editing !== 'new' && editing?.id === testCase.id ? (
              <li key={testCase.id}>
                <TestCaseForm initial={{ input: testCase.input, expectedOutput: testCase.expectedOutput, sample: testCase.sample, description: testCase.description, weight: testCase.weight ?? 1 }} busy={mutations.update.isPending} onCancel={() => setEditing(null)} onSave={save} />
              </li>
            ) : (
              <li key={testCase.id} className="px-5 py-4">
                <div className="mb-2.5 flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-fg-muted">#{index + 1}</span>
                  {testCase.sample ? (
                    <Badge tone="primary">
                      <Eye className="h-3 w-3" aria-hidden /> Sample
                    </Badge>
                  ) : (
                    <Badge>
                      <EyeOff className="h-3 w-3" aria-hidden /> Hidden
                    </Badge>
                  )}
                  {owner && testCase.weight != null && <span className="text-xs text-fg-muted">weight {testCase.weight}</span>}
                  {testCase.description && <span className="truncate text-xs text-fg-secondary">{testCase.description}</span>}
                  {owner && (
                    <span className="ml-auto flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" aria-label={`Edit test case ${index + 1}`} onClick={() => setEditing(testCase)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 hover:text-danger" aria-label={`Delete test case ${index + 1}`} onClick={() => setRemoving(testCase)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </span>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <IoBlock label="Input" value={testCase.input} />
                  <IoBlock label="Expected output" value={testCase.expectedOutput} />
                </div>
              </li>
            ),
          )}
        </ol>
      )}
      <ConfirmDialog
        open={Boolean(removing)}
        title="Delete this test case?"
        description="Solutions will no longer be judged against it."
        confirmLabel="Delete"
        loading={mutations.remove.isPending}
        onCancel={() => setRemoving(null)}
        onConfirm={() =>
          removing &&
          mutations.remove.mutate(removing.id, {
            onSuccess: () => toast.success('Test case deleted'),
            onError: (error) => toast.error("Couldn't delete the test case", { description: getErrorMessage(error) }),
            onSettled: () => setRemoving(null),
          })
        }
      />
    </Card>
  )
}
