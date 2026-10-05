import { useState } from 'react'
import { BookOpen, ExternalLink, FileText, Lock, X } from 'lucide-react'
import { DifficultyBadge } from '@/features/problems/components/ProblemRow'
import { LoadProblemDialog } from '@/features/room/components/LoadProblemDialog'
import { NotesEditor } from '@/features/room/components/NotesEditor'
import { useCollabDocument } from '@/features/room/hooks/useCollabDocument'
import type { RoomRealtime } from '@/features/room/hooks/useRoomRealtime'
import type { useSharedProblem } from '@/features/room/hooks/useSharedProblem'
import { cn } from '@/lib/utils'
import { paths } from '@/routes/paths'

const PROBLEM_PLACEHOLDER = `Write the problem statement here…

# Title
Describe the task, inputs and outputs.

## Examples
Input: …
Output: …

## Constraints
- …`

const PRIVATE_PLACEHOLDER = `Only the host and interviewers can see these notes.

- Signals: …
- Follow-up questions: …
- Hints given: …`

type Tab = 'problem' | 'private'

interface ProblemPanelProps {
  realtime: RoomRealtime
  user: { id: string; name: string }
  /** The shared problem document (lifted to the room so the editor can see the selected problem). */
  problemDoc: ReturnType<typeof useCollabDocument>
  shared: ReturnType<typeof useSharedProblem>
}

/**
 * Left column: the shared problem statement (everyone edits; observers read) and, for the host and
 * interviewers, private notes the candidate never receives (enforced by the editor server). Staff
 * can load a problem from the library; everyone sees which one is active.
 */
export function ProblemPanel({ realtime, user, problemDoc: problem, shared }: ProblemPanelProps) {
  const [tab, setTab] = useState<Tab>('problem')
  const [loadOpen, setLoadOpen] = useState(false)
  const staff = realtime.me.staff
  const activeTab = staff ? tab : 'problem'
  const canEdit = !(realtime.me.readonly || problem.readOnly)

  const notes = useCollabDocument({ code: realtime.code, kind: 'private', fetchTicket: realtime.fetchTicket, user, enabled: staff })
  const current = shared.problem

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-surface" aria-label="Problem">
      <div className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-border px-2">
        <div role="tablist" aria-label="Notes" className="flex min-w-0 items-center gap-0.5 rounded-lg bg-bg p-0.5">
          {(
            [
              { id: 'problem', label: 'Problem', icon: FileText, show: true },
              { id: 'private', label: 'Private notes', icon: Lock, show: staff },
            ] as const
          )
            .filter((item) => item.show)
            .map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={activeTab === id}
                onClick={() => setTab(id)}
                className={cn(
                  'flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[13px] font-medium whitespace-nowrap transition-colors',
                  activeTab === id ? 'bg-elevated text-fg shadow-sm' : 'text-fg-muted hover:text-fg',
                )}
              >
                <Icon className={cn('h-3.5 w-3.5', activeTab === id && 'text-primary')} aria-hidden />
                {label}
              </button>
            ))}
        </div>
        {staff && canEdit && activeTab === 'problem' ? (
          <button
            type="button"
            onClick={() => setLoadOpen(true)}
            className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-medium text-fg-secondary transition-colors hover:bg-elevated hover:text-fg"
            title="Load a problem from the library"
          >
            <BookOpen className="h-3.5 w-3.5" aria-hidden />
            <span className="hidden xl:inline">Library</span>
          </button>
        ) : (
          <span className="hidden truncate px-2 text-xs text-fg-muted 2xl:inline" title="Markdown is supported">
            {activeTab === 'private' ? 'Interviewers only' : canEdit ? 'Shared · Markdown' : 'View only'}
          </span>
        )}
      </div>

      {current && activeTab === 'problem' && (
        <div className="flex shrink-0 items-center gap-2 border-b border-border-subtle bg-primary/[0.05] px-3 py-2">
          <BookOpen className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
          <span className="min-w-0 flex-1 truncate text-[13px] font-medium" title={current.title}>
            {current.title}
          </span>
          <DifficultyBadge difficulty={current.difficulty} />
          {current.slug && (
            <a href={paths.problem(current.slug)} target="_blank" rel="noreferrer" className="rounded p-1 text-fg-muted hover:bg-elevated hover:text-fg" aria-label="Open the problem page in a new tab" title="Open in the library">
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
          {staff && canEdit && (
            <button type="button" onClick={shared.clear} className="rounded p-1 text-fg-muted hover:bg-elevated hover:text-fg" aria-label="Detach the library problem" title="Detach (keeps the text)">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      <div className={cn('min-h-0 flex-1', activeTab !== 'problem' && 'hidden')}>
        <NotesEditor
          text={problem.text}
          undoManager={problem.undoManager}
          awareness={problem.provider?.awareness}
          readOnly={!canEdit}
          placeholder={PROBLEM_PLACEHOLDER}
          label="Problem statement (shared)"
        />
      </div>
      {staff && (
        <div className={cn('min-h-0 flex-1', activeTab !== 'private' && 'hidden')}>
          <NotesEditor
            text={notes.text}
            undoManager={notes.undoManager}
            awareness={notes.provider?.awareness}
            readOnly={notes.readOnly}
            placeholder={PRIVATE_PLACEHOLDER}
            label="Private interviewer notes"
          />
        </div>
      )}

      {staff && <LoadProblemDialog open={loadOpen} onClose={() => setLoadOpen(false)} currentId={current?.id} onLoad={shared.select} />}
    </section>
  )
}
