import { useState } from 'react'
import { FileText, Lock } from 'lucide-react'
import { NotesEditor } from '@/features/room/components/NotesEditor'
import { useCollabDocument } from '@/features/room/hooks/useCollabDocument'
import type { RoomRealtime } from '@/features/room/hooks/useRoomRealtime'
import { cn } from '@/lib/utils'

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

/**
 * Left column: the shared problem statement (everyone edits; observers read) and, for the host and
 * interviewers, private notes the candidate never receives (enforced by the editor server).
 */
export function ProblemPanel({ realtime, user }: { realtime: RoomRealtime; user: { id: string; name: string } }) {
  const [tab, setTab] = useState<Tab>('problem')
  const staff = realtime.me.staff
  const activeTab = staff ? tab : 'problem'

  const problem = useCollabDocument({ code: realtime.code, kind: 'notes', fetchTicket: realtime.fetchTicket, user })
  const notes = useCollabDocument({ code: realtime.code, kind: 'private', fetchTicket: realtime.fetchTicket, user, enabled: staff })

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
                <Icon className={cn('h-3.5 w-3.5', activeTab === id && 'text-primary-hover')} aria-hidden />
                {label}
              </button>
            ))}
        </div>
        <span className="hidden truncate px-2 text-xs text-fg-muted 2xl:inline" title="Markdown is supported">
          {activeTab === 'private' ? 'Interviewers only' : problem.readOnly || realtime.me.readonly ? 'View only' : 'Shared · Markdown'}
        </span>
      </div>
      <div className={cn('min-h-0 flex-1', activeTab !== 'problem' && 'hidden')}>
        <NotesEditor
          text={problem.text}
          undoManager={problem.undoManager}
          awareness={problem.provider?.awareness}
          readOnly={realtime.me.readonly || problem.readOnly}
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
    </section>
  )
}
