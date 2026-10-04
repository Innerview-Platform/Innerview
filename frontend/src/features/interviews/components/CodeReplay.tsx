import { useEffect, useMemo, useState } from 'react'
import { Pause, Play } from 'lucide-react'
import * as Y from 'yjs'
import { Button } from '@/components/common/Button'
import { Spinner } from '@/components/common/Spinner'
import { ReadOnlyCode } from '@/features/interviews/components/ReadOnlyCode'

interface ReplayUpdate {
  at: number
  update: string
}

function decode(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

/**
 * Plays back how the code was written: every change the editor server recorded, applied in order.
 * The slider picks a moment; Play steps through at a readable pace.
 */
export function CodeReplay({ loadUpdates }: { loadUpdates: () => Promise<ReplayUpdate[]> }) {
  const [updates, setUpdates] = useState<ReplayUpdate[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [position, setPosition] = useState(0)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    loadUpdates()
      .then((list) => {
        setUpdates(list)
        setPosition(list.length)
      })
      .catch(() => setError("The replay couldn't be loaded."))
  }, [loadUpdates])

  // Text after each update (computed once; documents are small).
  const snapshots = useMemo(() => {
    if (!updates) return []
    const doc = new Y.Doc()
    const text = doc.getText('code')
    return updates.map(({ update }) => {
      Y.applyUpdate(doc, decode(update))
      return text.toString()
    })
  }, [updates])

  useEffect(() => {
    if (!playing || !updates) return
    if (position >= updates.length) {
      setPlaying(false)
      return
    }
    const timer = setTimeout(() => setPosition((p) => p + 1), 120)
    return () => clearTimeout(timer)
  }, [playing, position, updates])

  if (error) return <p className="p-4 text-sm text-fg-muted">{error}</p>
  if (!updates) return <div className="flex h-40 items-center justify-center text-fg-muted"><Spinner /></div>
  if (updates.length === 0) return <p className="p-4 text-sm text-fg-muted">No code was written in this interview.</p>

  const current = position === 0 ? '' : snapshots[position - 1]
  const startedAt = updates[0].at
  const at = position === 0 ? startedAt : updates[position - 1].at
  const elapsed = Math.round((at - startedAt) / 1000)

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-3 border-b border-border px-3 py-2">
        <Button
          size="icon"
          variant="secondary"
          className="h-8 w-8"
          aria-label={playing ? 'Pause' : 'Play'}
          onClick={() => {
            if (position >= updates.length) setPosition(0)
            setPlaying((p) => !p)
          }}
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <input
          type="range"
          min={0}
          max={updates.length}
          value={position}
          onChange={(e) => {
            setPlaying(false)
            setPosition(Number(e.target.value))
          }}
          className="min-w-0 flex-1 accent-[var(--color-primary)]"
          aria-label="Replay position"
        />
        <span className="w-24 text-right font-mono text-xs text-fg-muted tabular-nums">
          {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')} · {position}/{updates.length}
        </span>
      </div>
      <div className="min-h-0 flex-1">
        <ReadOnlyCode value={current} label="Code replay" />
      </div>
    </div>
  )
}
