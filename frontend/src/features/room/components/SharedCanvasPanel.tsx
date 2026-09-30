import { useState, type ReactNode } from 'react'
import { Excalidraw } from '@excalidraw/excalidraw'
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types'
import '@excalidraw/excalidraw/index.css'
import { AlertTriangle } from 'lucide-react'
import { Spinner } from '@/components/common/Spinner'
import { useCanvasSync } from '@/features/room/hooks/useCanvasSync'
import type { RoomRealtime } from '@/features/room/hooks/useRoomRealtime'

function CanvasMessage({ children, tone = 'muted' }: { children: ReactNode; tone?: 'muted' | 'danger' }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-sm text-fg-muted">
      {tone === 'danger' ? <AlertTriangle className="h-5 w-5 text-danger" aria-hidden /> : <Spinner />}
      <div>{children}</div>
    </div>
  )
}

interface SharedCanvasPanelProps {
  /** Room code. */
  roomId: string
  /** Fresh room ticket (read-only tickets give a view-only board, e.g. on the interview summary). */
  fetchTicket: RoomRealtime['fetchTicket']
  /** Rendered at the left of the panel's header (the workspace tabs). */
  header?: ReactNode
  className?: string
  readOnly?: boolean
}

/** System-design whiteboard shared by everyone in the room, synced through the self-hosted Excalidraw server. */
export function SharedCanvasPanel({ roomId, fetchTicket, header, className, readOnly = false }: SharedCanvasPanelProps) {
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null)
  const { status, error, viewOnly, onChange, onPointerUpdate } = useCanvasSync(api, roomId, fetchTicket, readOnly)

  const statusView = status === 'live'
    ? { label: 'Live', dot: 'bg-success' }
    : status === 'error'
      ? { label: 'Disconnected', dot: 'bg-danger' }
      : status === 'reconnecting'
        ? { label: 'Reconnecting…', dot: 'bg-warning animate-pulse' }
        : { label: 'Connecting…', dot: 'bg-warning animate-pulse' }

  return (
    <section className={`flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-surface ${className ?? ''}`} aria-label="Shared whiteboard">
      <div className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-border px-2">
        {header}
        <span className="flex items-center gap-2 px-2 text-xs text-fg-muted" role="status">
          <span className={`h-2 w-2 rounded-full ${statusView.dot}`} aria-hidden />
          {statusView.label}
        </span>
      </div>
      <div className="relative min-h-0 flex-1">
        {error && <div className="absolute inset-x-0 top-0 z-20 bg-surface" role="alert"><CanvasMessage tone="danger">{error}</CanvasMessage></div>}
        <div className="absolute inset-0">
          <Excalidraw
            excalidrawAPI={setApi}
            onChange={onChange}
            onPointerUpdate={onPointerUpdate}
            isCollaborating
            viewModeEnabled={viewOnly}
            theme="dark"
            name="InnerView whiteboard"
            autoFocus={false}
          />
        </div>
      </div>
    </section>
  )
}
