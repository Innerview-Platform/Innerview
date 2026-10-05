import { useEffect, useId, useState } from 'react'
import { Check, Plus, Search, X } from 'lucide-react'
import { Spinner } from '@/components/common/Spinner'
import { TextInput } from '@/components/forms/controls'
import { DifficultyBadge } from '@/features/problems/components/ProblemRow'
import { useProblemList } from '@/features/problems/hooks/useProblems'
import type { Problem } from '@/features/problems/types'
import { cn } from '@/lib/utils'

/** Debounced search value. */
function useDebounced(value: string, delay = 250) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

interface ProblemPickerProps {
  value: Problem[]
  onChange: (problems: Problem[]) => void
}

/** Search the active library and pick problems; the picked ones show as a removable summary. */
export function ProblemPicker({ value, onChange }: ProblemPickerProps) {
  const listId = useId()
  const [query, setQuery] = useState('')
  const search = useDebounced(query.trim())
  const results = useProblemList('all', { search: search || undefined, isActive: true }, 0, 8)
  const selectedIds = new Set(value.map((p) => p.id))

  const toggle = (problem: Problem) =>
    onChange(selectedIds.has(problem.id) ? value.filter((p) => p.id !== problem.id) : [...value, problem])

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <ul className="space-y-1.5" aria-label="Selected problems">
          {value.map((problem, index) => (
            <li key={problem.id} className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/[0.06] px-3 py-2">
              <span className="font-mono text-xs text-fg-muted">{index + 1}</span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{problem.title}</span>
              <DifficultyBadge difficulty={problem.difficulty} />
              <button type="button" onClick={() => toggle(problem)} className="rounded p-1 text-fg-muted hover:bg-elevated hover:text-fg" aria-label={`Remove ${problem.title}`}>
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="overflow-hidden rounded-lg border border-border">
        <div className="relative border-b border-border-subtle">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-fg-muted" aria-hidden />
          <TextInput
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the problem library"
            aria-label="Search problems"
            aria-controls={listId}
            className="h-10 rounded-none border-0 pl-9 focus:ring-0"
          />
          {results.isFetching && <Spinner size="sm" className="absolute top-3 right-3 text-fg-muted" />}
        </div>
        <ul id={listId} className="max-h-60 overflow-y-auto" aria-label="Problem search results">
          {results.isError ? (
            <li className="px-3 py-4 text-center text-xs text-danger">Couldn't load problems.</li>
          ) : results.data?.content.length === 0 ? (
            <li className="px-3 py-5 text-center text-xs text-fg-muted">{search ? 'No problems found' : 'The library is empty — write one under Problems.'}</li>
          ) : (
            results.data?.content.map((problem) => {
              const selected = selectedIds.has(problem.id)
              return (
                <li key={problem.id}>
                  <button
                    type="button"
                    onClick={() => toggle(problem)}
                    aria-pressed={selected}
                    className={cn('flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-elevated/60 ', selected && 'bg-primary/[0.05]')}
                  >
                    <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-md border', selected ? 'border-primary bg-primary text-on-primary' : 'border-border text-fg-muted')}>
                      {selected ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Plus className="h-3 w-3" aria-hidden />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{problem.title}</span>
                      {problem.tags?.length > 0 && <span className="block truncate text-xs text-fg-muted">{problem.tags.join(' · ')}</span>}
                    </span>
                    <DifficultyBadge difficulty={problem.difficulty} />
                  </button>
                </li>
              )
            })
          )}
        </ul>
      </div>
    </div>
  )
}
