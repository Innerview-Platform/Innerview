import { useEffect, useRef, useState, type FormEvent } from 'react'
import { CornerDownLeft, Eraser, SquareTerminal } from 'lucide-react'
import { Badge, type BadgeTone } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { Spinner } from '@/components/common/Spinner'
import type { CodeRunner, RunPhase, TerminalChunkKind } from '@/features/room/hooks/useCodeRunner'
import { cn } from '@/lib/utils'

const PHASE_BADGE: Record<RunPhase, { label: string; tone: BadgeTone }> = {
  idle: { label: 'Idle', tone: 'neutral' },
  starting: { label: 'Starting', tone: 'warning' },
  compiling: { label: 'Compiling', tone: 'warning' },
  running: { label: 'Running', tone: 'success' },
}

const CHUNK_CLASSES: Record<TerminalChunkKind, string> = {
  stdout: 'text-fg',
  stderr: 'text-danger',
  stdin: 'text-primary-hover',
  system: 'block text-fg-muted italic',
  error: 'block text-danger',
}

interface RunTerminalProps {
  runner: Pick<CodeRunner, 'phase' | 'runtime' | 'chunks' | 'sendInput' | 'clear'>
  connected: boolean
}

/** Shared output console. While a program runs, anything typed here is sent to its stdin. */
export function RunTerminal({ runner, connected }: RunTerminalProps) {
  const { phase, runtime, chunks, sendInput, clear } = runner
  const [input, setInput] = useState('')
  const outputRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const stickToBottom = useRef(true)
  const acceptsInput = connected && (phase === 'running' || phase === 'starting')

  useEffect(() => {
    const output = outputRef.current
    if (output && stickToBottom.current) output.scrollTop = output.scrollHeight
  }, [chunks])

  // Focus the input when a program starts so the user can answer prompts right away.
  useEffect(() => {
    if (phase === 'running') inputRef.current?.focus({ preventScroll: true })
  }, [phase])

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!acceptsInput) return
    if (sendInput(input)) setInput('')
  }

  const badge = PHASE_BADGE[phase]

  return (
    <section className="flex h-full min-h-0 flex-col bg-bg" aria-label="Run output">
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-1.5">
        <div className="flex min-w-0 items-center gap-2">
          <SquareTerminal className="h-4 w-4 shrink-0 text-fg-muted" aria-hidden />
          <h3 className="text-[13px] font-semibold">Terminal</h3>
          <Badge tone={badge.tone}>
            {phase !== 'idle' && <Spinner size="sm" className="h-2.5 w-2.5 border" />}
            {badge.label}
          </Badge>
          {runtime && <span className="truncate font-mono text-[11px] text-fg-muted">{runtime}</span>}
        </div>
        <Button variant="ghost" size="sm" className="h-7 px-2" onClick={clear} disabled={chunks.length === 0} title="Clear the terminal (only for you)">
          <Eraser className="h-3.5 w-3.5" aria-hidden />
          <span className="sr-only sm:not-sr-only">Clear</span>
        </Button>
      </div>

      <div
        ref={outputRef}
        onScroll={(event) => {
          const el = event.currentTarget
          stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 24
        }}
        onClick={() => {
          if (acceptsInput && !window.getSelection()?.toString()) inputRef.current?.focus()
        }}
        className="min-h-0 flex-1 overflow-auto px-3 py-2 font-mono text-[12.5px] leading-relaxed"
        role="log"
        aria-live="polite"
      >
        {chunks.length === 0 ? (
          <div className="space-y-1 text-fg-muted">
            <p>Press Run (or Ctrl+Enter in the editor) to execute the shared code. Output appears here for everyone in the room.</p>
            <p className="text-[11.5px]">
              Input is sent a line at a time. Programs that read until end-of-input never finish on their own — press Stop. Runs are
              limited to 5 minutes and 64 KB of output; in C, call <code>fflush(stdout)</code> after prompts.
            </p>
          </div>
        ) : (
          <pre className="whitespace-pre-wrap break-words">
            {chunks.map((chunk) => (
              <span key={chunk.id} className={CHUNK_CLASSES[chunk.kind]}>
                {chunk.text}
              </span>
            ))}
          </pre>
        )}
      </div>

      <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-border px-3 py-1.5">
        <span className="font-mono text-[13px] text-primary-hover" aria-hidden>
          ›
        </span>
        <label htmlFor="terminal-input" className="sr-only">
          Program input
        </label>
        <input
          id="terminal-input"
          ref={inputRef}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          disabled={!acceptsInput}
          autoComplete="off"
          spellCheck={false}
          placeholder={acceptsInput ? 'Type input for the program and press Enter' : 'Input is available while a program is running'}
          className="min-w-0 flex-1 bg-transparent font-mono text-[13px] text-fg outline-none placeholder:text-fg-muted disabled:cursor-not-allowed"
        />
        <Button type="submit" variant="ghost" size="sm" className={cn('h-7 px-2', !acceptsInput && 'invisible')} title="Send input (Enter)">
          <CornerDownLeft className="h-3.5 w-3.5" aria-hidden />
          <span className="sr-only">Send input</span>
        </Button>
      </form>
    </section>
  )
}
