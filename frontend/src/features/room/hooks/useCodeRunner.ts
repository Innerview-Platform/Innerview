import { useCallback, useEffect, useRef, useState } from 'react'
import { EDITOR_LANGUAGES, isEditorLanguage, type EditorLanguage } from '@/features/room/components/CollaborativeEditor'
import type { RoomRealtime } from '@/features/room/hooks/useRoomRealtime'
import type { CodeRunEvent } from '@/features/room/types'

export type TerminalChunkKind = 'stdout' | 'stderr' | 'stdin' | 'system' | 'error'

export interface TerminalChunk {
  id: number
  kind: TerminalChunkKind
  text: string
}

/** `starting` = waiting for the execution service; `compiling`/`running` mirror Piston's stages. */
export type RunPhase = 'idle' | 'starting' | 'compiling' | 'running'

const DEFAULT_LANGUAGE: EditorLanguage = 'python'
/** Keeps a runaway program from growing the DOM without bound. */
const MAX_TERMINAL_CHARS = 200_000

let chunkId = 0

function appendChunk(chunks: TerminalChunk[], kind: TerminalChunkKind, text: string): TerminalChunk[] {
  if (!text) return chunks
  const last = chunks[chunks.length - 1]
  // Merge consecutive output of the same kind so a chatty program renders as a few nodes.
  const next =
    last && last.kind === kind && kind !== 'system' && kind !== 'error'
      ? [...chunks.slice(0, -1), { ...last, text: last.text + text }]
      : [...chunks, { id: ++chunkId, kind, text }]

  let total = next.reduce((sum, chunk) => sum + chunk.text.length, 0)
  while (total > MAX_TERMINAL_CHARS && next.length > 1) total -= next.shift()!.text.length
  return next
}

function describeExit(event: CodeRunEvent): string | null {
  if (event.stage === 'compile') {
    return event.code === 0 && !event.signal ? null : `Compilation failed${event.code != null ? ` (exit code ${event.code})` : ''}`
  }
  if (event.signal) return event.signal === 'SIGKILL' ? 'Process stopped (time limit reached or stopped by a participant)' : `Process terminated by ${event.signal}`
  return `Process exited with code ${event.code ?? 0}`
}

/**
 * Shared, interactive code execution for the room. Every participant sees the same terminal:
 * the backend relays the program's output (and any input typed by anyone) on /topic/room/{id}/run.
 */
export function useCodeRunner(
  realtime: Pick<RoomRealtime, 'status' | 'send' | 'subscribeRun' | 'subscribeError' | 'room'>,
  currentUserId: string,
) {
  const { status, send, subscribeRun, subscribeError, room } = realtime
  const nameOf = (userId: string | undefined) =>
    userId === currentUserId ? 'you' : (room.participants.find((p) => p.userId === userId)?.name ?? 'someone')
  const nameRef = useRef(nameOf)
  useEffect(() => {
    nameRef.current = nameOf
  })
  /** Set when Run was refused because someone else's program is running; the UI asks to confirm. */
  const [busy, setBusy] = useState<{ startedBy: string; code: string } | null>(null)
  const pendingCode = useRef<string | null>(null)
  const [language, setLanguage] = useState<EditorLanguage>(DEFAULT_LANGUAGE)
  const [phase, setPhase] = useState<RunPhase>('idle')
  const [chunks, setChunks] = useState<TerminalChunk[]>([])
  const [runtime, setRuntime] = useState<string | null>(null)
  const runIdRef = useRef<string | null>(null)

  const push = useCallback((kind: TerminalChunkKind, text: string) => setChunks((current) => appendChunk(current, kind, text)), [])

  useEffect(
    () =>
      subscribeRun((event) => {
        // Output from a run that was replaced by a newer one.
        const isStale = event.runId !== undefined && runIdRef.current !== null && event.runId !== runIdRef.current
        switch (event.type) {
          case 'state':
            if (isEditorLanguage(event.language)) setLanguage(event.language)
            runIdRef.current = event.runId ?? null
            setPhase((current) => (event.running ? (current === 'idle' ? 'running' : current) : 'idle'))
            return
          case 'language':
            if (isEditorLanguage(event.language)) setLanguage(event.language)
            return
          case 'started': {
            runIdRef.current = event.runId ?? null
            if (isEditorLanguage(event.language)) setLanguage(event.language)
            setRuntime(null)
            setPhase('starting')
            const who = nameRef.current(event.userId)
            const label = isEditorLanguage(event.language) ? EDITOR_LANGUAGES[event.language].label : event.language
            // Keep a "Stopped by …" line from the run this one replaced.
            setChunks((previous) => {
              const lastChunk = previous[previous.length - 1]
              const keep = lastChunk?.text.startsWith('■ Stopped') ? [lastChunk] : []
              return appendChunk(keep, 'system', `▶ Running ${label} (started by ${who})`)
            })
            return
          }
          case 'runtime':
            if (isStale) return
            setRuntime(`${event.language} ${event.version}`)
            return
          case 'stage':
            if (isStale) return
            setPhase(event.stage === 'compile' ? 'compiling' : 'running')
            if (event.stage === 'compile') push('system', 'Compiling…')
            return
          case 'stdout':
          case 'stderr':
          case 'stdin':
            if (!isStale) push(event.type, event.data ?? '')
            return
          case 'exit': {
            if (isStale) return
            const message = describeExit(event)
            if (message) push(event.stage === 'compile' ? 'error' : 'system', message)
            return
          }
          case 'error':
            if (!isStale) push('error', event.data ?? 'Execution failed')
            return
          case 'stopped':
            push('system', `■ Stopped by ${nameRef.current(event.userId)}`)
            return
          case 'finished':
            if (isStale) return
            setPhase('idle')
            return
        }
      }),
    [subscribeRun, push, currentUserId],
  )

  // Run refused: another participant's program is running.
  useEffect(
    () =>
      subscribeError((error) => {
        if (error.code === 'RUN_BUSY' && pendingCode.current !== null) {
          setBusy({ startedBy: nameRef.current(error.startedBy), code: pendingCode.current })
          setPhase('running')
        }
      }),
    [subscribeError],
  )

  // After every (re)connect, ask for the room's language and whether a run is in progress.
  useEffect(() => {
    if (status === 'connected') send('RUN_SYNC')
  }, [status, send])

  const run = useCallback(
    (code: string, force = false) => {
      if (!code.trim()) {
        setChunks(appendChunk([], 'error', 'There is no code to run.'))
        return false
      }
      pendingCode.current = code
      setBusy(null)
      const sent = send('RUN_CODE', { language, plainText: code, force })
      if (sent) setPhase('starting')
      return sent
    },
    [language, send],
  )

  /** "Stop their program and run mine". */
  const forceRun = useCallback(() => {
    if (busy) run(busy.code, true)
  }, [busy, run])
  const dismissBusy = useCallback(() => setBusy(null), [])

  const stop = useCallback(() => send('RUN_STOP'), [send])

  const sendInput = useCallback((line: string) => send('RUN_STDIN', { data: `${line}\n` }), [send])

  const changeLanguage = useCallback(
    (next: EditorLanguage) => {
      setLanguage(next)
      send('RUN_LANGUAGE', { language: next })
    },
    [send],
  )

  const clear = useCallback(() => setChunks([]), [])

  return { language, changeLanguage, phase, isRunning: phase !== 'idle', runtime, chunks, run, forceRun, busy, dismissBusy, stop, sendInput, clear }
}

export type CodeRunner = ReturnType<typeof useCodeRunner>
