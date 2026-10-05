import { useMemo, useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CloudOff, Eye, FlaskConical, Play, Send, Square, SquareTerminal } from 'lucide-react'
import { Group, Panel, useDefaultLayout } from 'react-resizable-panels'
import { toast } from 'sonner'
import { Button } from '@/components/common/Button'
import { Select } from '@/components/forms/controls'
import { ConfirmDialog } from '@/components/modals/ConfirmDialog'
import { roomApi } from '@/features/room/api/roomApi'
import { CollaborativeEditor, EDITOR_LANGUAGES, type EditorLanguage } from '@/features/room/components/CollaborativeEditor'
import { layoutStorage } from '@/features/room/components/layout/layoutStorage'
import { ResizeHandle } from '@/features/room/components/layout/ResizeHandle'
import { JudgeResults } from '@/features/room/components/JudgeResults'
import { RunTerminal } from '@/features/room/components/RunTerminal'
import { useCodeRunner } from '@/features/room/hooks/useCodeRunner'
import { useCollabDocument } from '@/features/room/hooks/useCollabDocument'
import { useJudge } from '@/features/room/hooks/useJudge'
import type { RoomRealtime } from '@/features/room/hooks/useRoomRealtime'
import type { SharedProblem } from '@/features/room/hooks/useSharedProblem'
import { cn } from '@/lib/utils'

interface CodeEditorPanelProps {
  realtime: RoomRealtime
  user: { id: string; name: string }
  /** Rendered at the left of the panel's header (the workspace tabs). */
  header?: ReactNode
  /** The library problem loaded in the room, if any: enables Run samples and Submit. */
  problem?: SharedProblem | null
}

type BottomTab = 'terminal' | 'tests'

function BottomTabs({ value, onChange, testsBusy }: { value: BottomTab; onChange: (tab: BottomTab) => void; testsBusy: boolean }) {
  return (
    <div role="tablist" aria-label="Output" className="flex items-center gap-0.5 rounded-md bg-surface p-0.5">
      {(
        [
          { id: 'terminal', label: 'Terminal', icon: SquareTerminal },
          { id: 'tests', label: 'Tests', icon: FlaskConical },
        ] as const
      ).map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={value === id}
          onClick={() => onChange(id)}
          className={cn(
            'flex h-7 items-center gap-1.5 rounded px-2 text-[12.5px] font-medium transition-colors',
            value === id ? 'bg-elevated text-fg' : 'text-fg-muted hover:text-fg',
          )}
        >
          <Icon className={cn('h-3.5 w-3.5', value === id && 'text-primary')} aria-hidden />
          {label}
          {id === 'tests' && testsBusy && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" aria-label="in progress" />}
        </button>
      ))}
    </div>
  )
}

export function CodeEditorPanel({ realtime, user, header, problem = null }: CodeEditorPanelProps) {
  const document = useCollabDocument({ code: realtime.code, kind: 'code', fetchTicket: realtime.fetchTicket, user })
  const { text, undoManager, provider } = document
  const runner = useCodeRunner(realtime, user.id)
  const connected = realtime.status === 'connected'
  const readOnly = realtime.me.readonly || document.readOnly
  const judge = useJudge({ problem, interviewId: realtime.room.interviewId, language: runner.language })
  const [bottomTab, setBottomTab] = useState<BottomTab>('terminal')
  const showTests = Boolean(problem) && bottomTab === 'tests'
  const judgeDisabledReason = !judge.judgeLanguage
    ? `${EDITOR_LANGUAGES[runner.language].label} isn't in the judge's language catalog`
    : judge.busy
      ? 'Waiting for the current result'
      : undefined
  const runJudge = (kind: 'samples' | 'submit') => {
    const code = text.toString()
    if (!code.trim()) {
      toast.error('Nothing to judge', { description: 'Write some code first.' })
      return
    }
    setBottomTab('tests')
    if (kind === 'samples') judge.runSamples(code)
    else void judge.submit(code)
  }

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
              <Button
                size="sm"
                variant={problem ? 'secondary' : 'primary'}
                disabled={!connected}
                leftIcon={<Play className="h-3.5 w-3.5" />}
                onClick={() => {
                  setBottomTab('terminal')
                  run()
                }}
                title="Run the code in the shared terminal (Ctrl+Enter)"
              >
                Run
              </Button>
            ))}
          {!readOnly && problem && (
            <>
              <Button
                size="sm"
                variant="secondary"
                disabled={Boolean(judgeDisabledReason)}
                leftIcon={<FlaskConical className="h-3.5 w-3.5" />}
                onClick={() => runJudge('samples')}
                title={judgeDisabledReason ?? 'Check your code against the sample cases'}
              >
                Samples
              </Button>
              <Button
                size="sm"
                disabled={Boolean(judgeDisabledReason)}
                loading={judge.state?.kind === 'submission' && judge.busy}
                leftIcon={<Send className="h-3.5 w-3.5" />}
                onClick={() => runJudge('submit')}
                title={judgeDisabledReason ?? `Judge your solution against every test case of “${problem.title}”`}
              >
                Submit
              </Button>
            </>
          )}
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
          {showTests ? (
            <JudgeResults judge={judge} language={runner.language} headerStart={<BottomTabs value={bottomTab} onChange={setBottomTab} testsBusy={judge.busy} />} />
          ) : (
            <RunTerminal
              runner={runner}
              connected={connected && !readOnly}
              headerStart={problem ? <BottomTabs value={bottomTab} onChange={setBottomTab} testsBusy={judge.busy} /> : undefined}
            />
          )}
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
