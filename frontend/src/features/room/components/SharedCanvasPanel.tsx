import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { CaptureUpdateAction, Excalidraw, reconcileElements } from '@excalidraw/excalidraw'
import type { BinaryFiles, ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types'
import type { RemoteExcalidrawElement } from '@excalidraw/excalidraw/data/reconcile'
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types'
import '@excalidraw/excalidraw/index.css'
import { AlertTriangle } from 'lucide-react'
import { Spinner } from '@/components/common/Spinner'
import { getCanvasUrl } from '@/constants/config'
import type { RoomRealtime } from '@/features/room/hooks/useRoomRealtime'
import { useTheme } from '@/lib/theme'

type Scene = { elements: readonly ExcalidrawElement[]; files: BinaryFiles }
type CanvasStatus = 'connecting' | 'live' | 'reconnecting' | 'error'

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
  const { theme } = useTheme()
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null)
  const [status, setStatus] = useState<CanvasStatus>('connecting')
  const socketRef = useRef<WebSocket | null>(null)
  const applyingRemote = useRef(false)
  const pendingScene = useRef<Scene | null>(null)
  const sendTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const applyScene = useCallback((scene: Scene) => {
    if (!api) {
      pendingScene.current = scene
      return
    }
    applyingRemote.current = true
    // Replies can describe an older scene than the one currently being drawn.
    // Reconcile keeps unsent/newer local strokes, deletion tombstones, and active edits.
    const elements = reconcileElements(
      api.getSceneElementsIncludingDeleted(),
      scene.elements as readonly RemoteExcalidrawElement[],
      api.getAppState(),
    )
    api.updateScene({ elements, captureUpdate: CaptureUpdateAction.NEVER })
    api.addFiles(Object.values(scene.files))
    queueMicrotask(() => { applyingRemote.current = false })
  }, [api])

  useEffect(() => {
    if (!api || !pendingScene.current) return
    const scene = pendingScene.current
    pendingScene.current = null
    applyScene(scene)
  }, [api, applyScene])

  useEffect(() => {
    let stopped = false
    let retryTimer: ReturnType<typeof setTimeout> | undefined
    let retryDelay = 500
    let socket: WebSocket | null = null

    const connect = async () => {
      try {
        const ticket = await fetchTicket()
        if (stopped) return
        const url = new URL(getCanvasUrl(`/connect/${encodeURIComponent(roomId)}`, { ws: true }))
        url.searchParams.set('token', ticket)
        socket = new WebSocket(url)
        socketRef.current = socket
        socket.onopen = () => setStatus(retryDelay > 500 ? 'reconnecting' : 'connecting')
        socket.onmessage = (event) => {
          let message: { type?: string; scene?: Scene }
          try { message = JSON.parse(event.data as string) as typeof message } catch { return }
          if (message.type !== 'scene' || !message.scene) return
          applyScene(message.scene)
          setStatus('live')
          retryDelay = 500
        }
        socket.onerror = () => socket?.close()
        socket.onclose = () => {
          if (socketRef.current === socket) socketRef.current = null
          if (stopped) return
          setStatus('reconnecting')
          retryTimer = setTimeout(connect, retryDelay)
          retryDelay = Math.min(retryDelay * 2, 10_000)
        }
      } catch {
        if (!stopped) {
          setStatus('error')
          retryTimer = setTimeout(connect, retryDelay)
          retryDelay = Math.min(retryDelay * 2, 10_000)
        }
      }
    }

    void connect()
    return () => {
      stopped = true
      if (retryTimer) clearTimeout(retryTimer)
      if (socketRef.current === socket) socketRef.current = null
      socket?.close()
      if (sendTimer.current) clearTimeout(sendTimer.current)
    }
  }, [roomId, fetchTicket, applyScene])

  const onChange = useCallback((elements: readonly ExcalidrawElement[], _appState: unknown, files: BinaryFiles) => {
    if (readOnly || applyingRemote.current) return
    if (sendTimer.current) clearTimeout(sendTimer.current)
    sendTimer.current = setTimeout(() => {
      const socket = socketRef.current
      if (socket?.readyState === WebSocket.OPEN) {
        // Read at send time: a remote merge may have happened during the debounce.
        socket.send(JSON.stringify({ type: 'scene', scene: {
          elements: api?.getSceneElementsIncludingDeleted() ?? elements,
          files: api?.getFiles() ?? files,
        } }))
      }
    }, 120)
  }, [readOnly, api])

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
        {status === 'error' && <CanvasMessage tone="danger">The whiteboard server can't be reached. Reconnecting…</CanvasMessage>}
        <div className="absolute inset-0">
          <Excalidraw
            excalidrawAPI={setApi}
            onChange={onChange}
            isCollaborating
            viewModeEnabled={readOnly}
            theme={theme}
            name="InnerView whiteboard"
            autoFocus={false}
          />
        </div>
      </div>
    </section>
  )
}
