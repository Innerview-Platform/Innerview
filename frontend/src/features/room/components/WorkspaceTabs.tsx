import { Code2, PenTool, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export type WorkspaceTab = 'code' | 'whiteboard'

const TABS: { id: WorkspaceTab; label: string; icon: LucideIcon }[] = [
  { id: 'code', label: 'Code', icon: Code2 },
  { id: 'whiteboard', label: 'Whiteboard', icon: PenTool },
]

/** Switches the main workspace between the shared editor and the system-design whiteboard. */
export function WorkspaceTabs({ value, onChange }: { value: WorkspaceTab; onChange: (tab: WorkspaceTab) => void }) {
  return (
    <div role="tablist" aria-label="Workspace" className="flex items-center gap-0.5 rounded-lg bg-bg p-0.5">
      {TABS.map(({ id, label, icon: Icon }) => {
        const active = value === id
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(id)}
            className={cn(
              'flex h-8 items-center gap-1.5 rounded-md px-3 text-[13px] font-medium transition-colors',
              active ? 'bg-elevated text-fg shadow-sm' : 'text-fg-muted hover:text-fg',
            )}
          >
            <Icon className={cn('h-3.5 w-3.5', active && 'text-primary-hover')} aria-hidden />
            {label}
          </button>
        )
      })}
    </div>
  )
}
