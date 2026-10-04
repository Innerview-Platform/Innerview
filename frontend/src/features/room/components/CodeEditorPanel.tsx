import { useState } from 'react'
import { Save } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/common/Button'
import { Select } from '@/components/forms/controls'
import { CollaborativeEditor, EDITOR_LANGUAGES, type EditorLanguage } from '@/features/room/components/CollaborativeEditor'
import type { RoomRealtime } from '@/features/room/hooks/useRoomRealtime'
import { useSharedCode } from '@/features/room/hooks/useSharedCode'

export function CodeEditorPanel({ realtime }: { realtime: RoomRealtime }) {
  const { text, undoManager, saveSnapshot } = useSharedCode(realtime)
  // Highlighting is a personal preference; the backend has no field to share it.
  const [language, setLanguage] = useState<EditorLanguage>('javascript')
  const connected = realtime.status === 'connected'

  return (
    <section className="flex h-full min-h-[420px] flex-col overflow-hidden rounded-xl border border-border bg-surface" aria-label="Shared code editor">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
        <div className="flex items-center gap-2">
          <h2 className="px-1 text-sm font-semibold">Shared editor</h2>
          <span className="text-xs text-fg-muted">{connected ? 'Live' : 'Offline — changes sync when reconnected'}</span>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="editor-language" className="sr-only">
            Syntax highlighting
          </label>
          <Select id="editor-language" className="h-8 w-auto text-[13px]" value={language} onChange={(e) => setLanguage(e.target.value as EditorLanguage)}>
            {Object.entries(EDITOR_LANGUAGES).map(([value, { label }]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Button
            variant="secondary"
            size="sm"
            disabled={!connected}
            leftIcon={<Save className="h-3.5 w-3.5" />}
            title="Save the current code on the server"
            onClick={() => {
              if (saveSnapshot()) toast.success('Code snapshot saved')
            }}
          >
            Save
          </Button>
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <CollaborativeEditor text={text} undoManager={undoManager} language={language} label="Shared code editor" />
      </div>
    </section>
  )
}
