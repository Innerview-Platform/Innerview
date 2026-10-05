import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Clock, Cpu } from 'lucide-react'
import { Badge, type BadgeTone } from '@/components/common/Badge'
import { DIFFICULTY_LABELS, type Difficulty, type Problem } from '@/features/problems/types'
import { cn } from '@/lib/utils'
import { paths } from '@/routes/paths'

const DIFFICULTY_TONE: Record<Difficulty, BadgeTone> = { EASY: 'success', MEDIUM: 'warning', HARD: 'danger' }

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return <Badge tone={DIFFICULTY_TONE[difficulty] ?? 'neutral'}>{DIFFICULTY_LABELS[difficulty] ?? difficulty}</Badge>
}

export function TagChip({ tag, active, onClick }: { tag: string; active?: boolean; onClick?: (tag: string) => void }) {
  const className = cn(
    'inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-medium transition-colors',
    active ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border text-fg-secondary',
    onClick && 'hover:border-primary/40 hover:text-primary',
  )
  if (!onClick) return <span className={className}>{tag}</span>
  return (
    <button type="button" className={className} onClick={() => onClick(tag)} aria-pressed={active} title={`Filter by ${tag}`}>
      {tag}
    </button>
  )
}

export function ProblemLimits({ problem, className }: { problem: Pick<Problem, 'timeLimitMs' | 'memoryLimitMb'>; className?: string }) {
  if (!problem.timeLimitMs && !problem.memoryLimitMb) return null
  return (
    <span className={cn('inline-flex items-center gap-3 text-xs text-fg-muted', className)}>
      {problem.timeLimitMs ? (
        <span className="inline-flex items-center gap-1" title="Time limit per test">
          <Clock className="h-3.5 w-3.5" aria-hidden /> {problem.timeLimitMs >= 1000 ? `${problem.timeLimitMs / 1000} s` : `${problem.timeLimitMs} ms`}
        </span>
      ) : null}
      {problem.memoryLimitMb ? (
        <span className="inline-flex items-center gap-1" title="Memory limit">
          <Cpu className="h-3.5 w-3.5" aria-hidden /> {problem.memoryLimitMb} MB
        </span>
      ) : null}
    </span>
  )
}

/** One problem in a list: title, difficulty, tags and limits; links to its page. */
export function ProblemRow({ problem, activeTag, onTag, actions }: { problem: Problem; activeTag?: string; onTag?: (tag: string) => void; actions?: ReactNode }) {
  return (
    <li className="group relative flex items-center gap-4 px-5 py-4 transition-colors hover:bg-elevated/40">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link to={paths.problem(problem.slug)} className="truncate font-medium text-fg after:absolute after:inset-0 hover:underline">
            {problem.title}
          </Link>
          <DifficultyBadge difficulty={problem.difficulty} />
        </div>
        <div className="relative mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {problem.tags?.length > 0 && (
            <span className="flex flex-wrap gap-1">
              {problem.tags.map((tag) => (
                <TagChip key={tag} tag={tag} active={tag === activeTag} onClick={onTag} />
              ))}
            </span>
          )}
          <ProblemLimits problem={problem} />
          {problem.createdBy?.name && <span className="text-xs text-fg-muted">by {problem.createdBy.name}</span>}
        </div>
      </div>
      {actions ? <div className="relative flex shrink-0 items-center gap-1">{actions}</div> : <ChevronRight className="h-4 w-4 shrink-0 text-fg-muted transition-transform group-hover:translate-x-0.5" aria-hidden />}
    </li>
  )
}
