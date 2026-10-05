import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArchiveRestore, BookOpen, Pencil, Plus, Search, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { SkeletonRows } from '@/components/common/Skeleton'
import { EmptyState, ErrorState } from '@/components/feedback/states'
import { Select, TextInput } from '@/components/forms/controls'
import { PageHeader } from '@/components/layout/PageHeader'
import { Pagination } from '@/components/tables/Pagination'
import { ProblemFormModal } from '@/features/problems/components/ProblemFormModal'
import { ProblemRow } from '@/features/problems/components/ProblemRow'
import { useProblemList, useProblemMutations } from '@/features/problems/hooks/useProblems'
import { DIFFICULTIES, DIFFICULTY_LABELS, type Difficulty, type OwnedProblem } from '@/features/problems/types'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { getErrorMessage } from '@/lib/apiError'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 15
type Tab = 'library' | 'mine' | 'archived'
const TABS: { id: Tab; label: string }[] = [
  { id: 'library', label: 'Library' },
  { id: 'mine', label: 'My problems' },
  { id: 'archived', label: 'Archived' },
]

export default function ProblemsPage() {
  useDocumentTitle('Problems')
  const [params, setParams] = useSearchParams()
  const tab = (TABS.some((t) => t.id === params.get('tab')) ? params.get('tab') : 'library') as Tab
  const difficulty = DIFFICULTIES.find((d) => d === params.get('difficulty')) as Difficulty | undefined
  const tag = params.get('tag') ?? undefined
  const search = params.get('q') ?? ''
  const page = Math.max(0, Number(params.get('page') ?? 0) || 0)

  const update = (changes: Record<string, string | undefined>) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        for (const [key, value] of Object.entries(changes)) value ? next.set(key, value) : next.delete(key)
        if (!('page' in changes)) next.delete('page')
        return next
      },
      { replace: true },
    )

  // Search as you type, without a request per keystroke.
  const [draft, setDraft] = useState(search)
  useEffect(() => {
    if (draft.trim() === search) return
    const timer = setTimeout(() => update({ q: draft.trim() || undefined }), 300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft])

  const filters = { search: search || undefined, difficulty, tag, isActive: tab === 'library' ? true : tab === 'mine' ? true : false }
  const problems = useProblemList(tab === 'library' ? 'all' : 'mine', filters, page, PAGE_SIZE)
  const { restore } = useProblemMutations()
  const [form, setForm] = useState<{ problem: OwnedProblem | null } | null>(null)

  const data = problems.data
  const hasFilters = Boolean(search || difficulty || tag)

  return (
    <>
      <PageHeader
        title="Problems"
        description="A shared library of interview problems. Attach them to interviews, and judge solutions against their test cases."
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setForm({ problem: null })}>
            New problem
          </Button>
        }
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-border px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div role="tablist" aria-label="Problem lists" className="flex w-fit gap-0.5 rounded-lg bg-bg p-0.5">
            {TABS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                onClick={() => update({ tab: id === 'library' ? undefined : id })}
                className={cn(
                  'h-8 rounded-md px-3 text-[13px] font-medium transition-colors',
                  tab === id ? 'bg-elevated text-fg shadow-sm' : 'text-fg-muted hover:text-fg',
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative sm:w-64">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-fg-muted" aria-hidden />
              <label htmlFor="problem-search" className="sr-only">
                Search problems
              </label>
              <TextInput id="problem-search" type="search" className="h-9 pl-9" placeholder="Search problems" value={draft} onChange={(e) => setDraft(e.target.value)} />
            </div>
            <label htmlFor="problem-difficulty" className="sr-only">
              Difficulty
            </label>
            <Select id="problem-difficulty" className="h-9 sm:w-40" value={difficulty ?? ''} onChange={(e) => update({ difficulty: e.target.value || undefined })}>
              <option value="">Any difficulty</option>
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {DIFFICULTY_LABELS[d]}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {tag && (
          <div className="flex items-center gap-2 border-b border-border-subtle px-5 py-2 text-[13px] text-fg-secondary">
            Topic
            <button type="button" onClick={() => update({ tag: undefined })} className="inline-flex items-center gap-1 rounded-md border border-primary/40 bg-primary/10 px-1.5 py-0.5 text-[12px] font-medium text-primary hover:bg-primary/15" aria-label={`Remove topic filter ${tag}`}>
              {tag} <X className="h-3 w-3" aria-hidden />
            </button>
          </div>
        )}

        {problems.isPending ? (
          <SkeletonRows rows={5} className="p-5" />
        ) : problems.isError ? (
          <ErrorState error={problems.error} title="Couldn't load problems" onRetry={() => problems.refetch()} retrying={problems.isFetching} />
        ) : !data || data.content.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="h-5 w-5" />}
            title={hasFilters ? 'No problems found' : tab === 'archived' ? 'Nothing archived' : tab === 'mine' ? "You haven't written any problems yet" : 'The library is empty'}
            description={hasFilters ? 'Try a different search, difficulty or topic.' : tab === 'archived' ? 'Problems you archive show up here, and can be restored.' : 'Write a problem once and reuse it in every interview.'}
            action={
              hasFilters ? (
                <Button variant="secondary" size="sm" onClick={() => { setDraft(''); update({ q: undefined, difficulty: undefined, tag: undefined }) }}>
                  Clear filters
                </Button>
              ) : tab !== 'archived' ? (
                <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setForm({ problem: null })}>
                  New problem
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <ul className={cn('divide-y divide-border-subtle transition-opacity', problems.isPlaceholderData && 'opacity-60')}>
              {data.content.map((problem) => (
                <ProblemRow
                  key={problem.id}
                  problem={problem}
                  activeTag={tag}
                  onTag={(t) => update({ tag: t === tag ? undefined : t })}
                  actions={
                    tab === 'mine' ? (
                      <Button size="sm" variant="ghost" leftIcon={<Pencil className="h-3.5 w-3.5" />} onClick={() => setForm({ problem: problem as OwnedProblem })}>
                        Edit
                      </Button>
                    ) : tab === 'archived' ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        leftIcon={<ArchiveRestore className="h-3.5 w-3.5" />}
                        loading={restore.isPending && restore.variables === problem.id}
                        onClick={() =>
                          restore.mutate(problem.id, {
                            onSuccess: () => toast.success('Problem restored', { description: 'It’s back in the library.' }),
                            onError: (error) => toast.error("Couldn't restore the problem", { description: getErrorMessage(error) }),
                          })
                        }
                      >
                        Restore
                      </Button>
                    ) : undefined
                  }
                />
              ))}
            </ul>
            <Pagination
              page={data.number}
              totalPages={data.totalPages}
              totalElements={data.totalElements}
              pageSize={PAGE_SIZE}
              isFetching={problems.isFetching}
              onPageChange={(next) => update({ page: next ? String(next) : undefined })}
            />
          </>
        )}
      </Card>

      <ProblemFormModal open={Boolean(form)} problem={form?.problem} onClose={() => setForm(null)} />
    </>
  )
}
