import { useMemo, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CloudOff, Eye, Play, Square } from 'lucide-react'
import { Group, Panel, useDefaultLayout } from 'react-resizable-panels'
import { toast } from 'sonner'
import { Button } from '@/components/common/Button'
import { Select } from '@/components/forms/controls'
import { ConfirmDialog } from '@/components/modals/ConfirmDialog'
import { roomApi } from '@/features/room/api/roomApi'
import { CollaborativeEditor, EDITOR_LANGUAGES, type EditorLanguage } from '@/features/room/components/CollaborativeEditor'
import { layoutStorage } from '@/features/room/components/layout/layoutStorage'
import { ResizeHandle } from '@/features/room/components/layout/ResizeHandle'
import { RunTerminal } from '@/features/room/components/RunTerminal'
import { useCodeRunner } from '@/features/room/hooks/useCodeRunner'
import { useCollabDocument } from '@/features/room/hooks/useCollabDocument'
import type { RoomRealtime } from '@/features/room/hooks/useRoomRealtime'

interface CodeEditorPanelProps {
  realtime: RoomRealtime
  user: { id: string; name: string }
  /** Rendered at the left of the panel's header (the workspace tabs). */
  header?: ReactNode
}

export function CodeEditorPanel({ realtime, user, header }: CodeEditorPanelProps) {
  const document = useCollabDocument({ code: realtime.code, kind: 'code', fetchTicket: realtime.fetchTicket, user })
  const { text, undoManager, provider } = document
  const runner = useCodeRunner(realtime, user.id)
  const connected = realtime.status === 'connected'
  const readOnly = realtime.me.readonly || document.readOnly

  // Only offer languages installed in the execution service; fall back to all of them if it can't be reached.
  const runtimes = useQuery({ queryKey: ['code-runner', 'runtimes'], queryFn: roomApi.getRuntimes, staleTime: 5 * 60_000, retry: 1 })
  const languageOptions = useMemo(() => {
    const installed = new Map((runtimes.data ?? []).map((runtime) => [runtime.language, runtime.version]))
    return (Object.keys(EDITOR_LANGUAGES) as EditorLanguage[])
      .filter((language) => installed.size === 0 || installed.has(language) || language === runner.language)
      .map((language) => ({ value: language, label: EDITOR_LANGUAGES[language].label, version: installed.get(language) }))
  }, [runtimes.data, runner.language])

  const onLanguageChange = (language: EditorLanguage) => {
    runner.changeLanguage(language)
    // Seed an empty editor with a starter program (it syncs to everyone like any other edit).
    if (text.length === 0 && !readOnly) text.insert(0, EDITOR_LANGUAGES[language].template)
  }

  const run = () => {
    if (!connected) {
      toast.error('Not connected', { description: 'Reconnect to the room to run code.' })
      return
    }
    runner.run(text.toString())
  }

  // Editor / terminal split, remembered per browser.
  const split = useDefaultLayout({ id: 'innerview-editor-terminal', storage: layoutStorage })

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-surface" aria-label="Shared code editor">
      <div className="flex min-h-12 shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border px-2 py-1.5">
        <div className="flex items-center gap-3">
          {header}
          {readOnly && (
            <span className="flex items-center gap-1 text-xs text-fg-muted">
              <Eye className="h-3.5 w-3.5" aria-hidden /> View only
            </span>
          )}
          {document.status === 'offline' && (
            <span className="flex items-center gap-1 text-xs text-warning">
              <CloudOff className="h-3.5 w-3.5" aria-hidden /> Offline — edits sync when reconnected
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="editor-language" className="sr-only">
            Programming language
          </label>
          <Select
            id="editor-language"
            className="h-8 w-auto text-[13px]"
            value={runner.language}
            onChange={(e) => onLanguageChange(e.target.value as EditorLanguage)}
            disabled={runner.isRunning || readOnly}
            title="Language used to highlight and run the code (shared with the room)"
          >
            {languageOptions.map(({ value, label, version }) => (
              <option key={value} value={value}>
                {version ? `${label} (${version})` : label}
              </option>
            ))}
          </Select>
          {!readOnly &&
            (runner.isRunning ? (
              <Button variant="danger" size="sm" disabled={!connected} leftIcon={<Square className="h-3.5 w-3.5" />} onClick={runner.stop} title="Stop the running program">
                Stop
              </Button>
            ) : (
              <Button size="sm" disabled={!connected} leftIcon={<Play className="h-3.5 w-3.5" />} onClick={run} title="Run the code (Ctrl+Enter)">
                Run
              </Button>
            ))}
        </div>
      </div>

      <Group orientation="vertical" id="innerview-editor-terminal" className="min-h-0 flex-1" defaultLayout={split.defaultLayout} onLayoutChanged={split.onLayoutChanged}>
        <Panel id="editor" minSize="120px">
          <CollaborativeEditor
            text={text}
            undoManager={undoManager}
            awareness={provider?.awareness}
            readOnly={readOnly}
            language={runner.language}
            label="Shared code editor"
            onRun={runner.isRunning || readOnly ? undefined : run}
          />
        </Panel>
        <ResizeHandle orientation="horizontal" className="border-y border-border bg-surface" />
        <Panel id="terminal" defaultSize="32%" minSize="96px" maxSize="80%">
          <RunTerminal runner={runner} connected={connected && !readOnly} />
        </Panel>
      </Group>

      <ConfirmDialog
        open={Boolean(runner.busy)}
        title="A program is already running"
        description={`${runner.busy?.startedBy ?? 'Someone'} started a program that's still running. Stop it and run your code instead?`}
        confirmLabel="Stop it and run mine"
        tone="danger"
        onConfirm={runner.forceRun}
        onCancel={runner.dismissBusy}
      />
    </section>
  )
}
