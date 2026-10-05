import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { toast } from 'sonner'
import { SkeletonRows } from '@/components/common/Skeleton'
import { Spinner } from '@/components/common/Spinner'
import { TextInput } from '@/components/forms/controls'
import { Modal } from '@/components/modals/Modal'
import { problemsApi } from '@/features/problems/api/problemsApi'
import { DifficultyBadge } from '@/features/problems/components/ProblemRow'
import { useProblemList } from '@/features/problems/hooks/useProblems'
import type { Problem, TestCase } from '@/features/problems/types'
import { getErrorMessage } from '@/lib/apiError'

interface LoadProblemDialogProps {
  open: boolean
  onClose: () => void
  currentId?: string
  onLoad: (problem: Problem, samples: TestCase[]) => void
}

/** Pick a library problem to load into the room's shared problem area. */
export function LoadProblemDialog({ open, onClose, currentId, onLoad }: LoadProblemDialogProps) {
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState<string | null>(null)
  useEffect(() => {
    const timer = setTimeout(() => setSearch(query.trim()), 250)
    return () => clearTimeout(timer)
  }, [query])
  const results = useProblemList('all', { search: search || undefined, isActive: true }, 0, 20, open)

  const choose = async (problem: Problem) => {
    setLoading(problem.id)
    try {
      const cases = await problemsApi.testCases(problem.id)
      onLoad(problem, cases.filter((c) => c.sample))
      toast.success(`Loaded “${problem.title}”`, { description: 'Everyone in the room now sees it.' })
      onClose()
    } catch (error) {
      toast.error("Couldn't load the problem", { description: getErrorMessage(error) })
    } finally {
      setLoading(null)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Load a problem"
      description="Replaces the shared problem statement for everyone. Submissions are judged only for problems attached when the interview was created."
      className="max-w-lg"
    >
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-fg-muted" aria-hidden />
        <TextInput type="search" data-autofocus className="pl-9" placeholder="Search the library" aria-label="Search problems" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      <div className="mt-3 max-h-80 overflow-y-auto rounded-lg border border-border">
        {results.isPending ? (
          <SkeletonRows rows={3} className="p-3" />
        ) : results.isError ? (
          <p className="p-4 text-center text-sm text-danger">{getErrorMessage(results.error)}</p>
        ) : results.data.content.length === 0 ? (
          <p className="p-6 text-center text-sm text-fg-muted">{search ? 'No problems found' : 'The library is empty.'}</p>
        ) : (
          <ul className="divide-y divide-border-subtle">
            {results.data.content.map((problem) => (
              <li key={problem.id}>
                <button
                  type="button"
                  onClick={() => void choose(problem)}
                  disabled={Boolean(loading)}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-elevated/60 disabled:opacity-60"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {problem.title}
                      {problem.id === currentId && <span className="ml-2 text-xs font-normal text-primary">Current</span>}
                    </span>
                    {problem.tags?.length > 0 && <span className="block truncate text-xs text-fg-muted">{problem.tags.join(' · ')}</span>}
                  </span>
                  {loading === problem.id ? <Spinner size="sm" className="text-primary" /> : <DifficultyBadge difficulty={problem.difficulty} />}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  )
}
