import { useCallback, useEffect, useRef, useState } from 'react'
import { CaptureUpdateAction, reconcileElements } from '@excalidraw/excalidraw'
import type { RemoteExcalidrawElement } from '@excalidraw/excalidraw/data/reconcile'
import type { OrderedExcalidrawElement } from '@excalidraw/excalidraw/element/types'
import type { BinaryFiles, Collaborator, ExcalidrawImperativeAPI, ExcalidrawProps, SocketId } from '@excalidraw/excalidraw/types'
import { getCanvasUrl } from '@/constants/config'
import { presenceColor } from '@/features/room/utils/presence'

interface Scene { elements: readonly OrderedExcalidrawElement[]; files: BinaryFiles }
interface Peer {
  sessionId: string
  userId: string
  name: string
  pointer?: { x: number; y: number }
  button?: 'up' | 'down'
  selectedElementIds?: Record<string, true>
}
type Message =
  | { type: 'scene'; scene: Scene; readonly?: boolean; sessionId?: string }
  | { type: 'presence'; peers: Peer[] }
  | { type: 'error'; message: string }

/** Files are content-addressed. Ignore viewport, tool, selection, and file retrieval changes. */
function signature(scene: Scene) {
  return JSON.stringify([
    scene.elements.map(({ id, version, versionNonce, index }) => [id, version, versionNonce, index]),
    Object.keys(scene.files).sort(),
  ])
}

function documentScene(elements: Scene['elements'], files: BinaryFiles): Scene {
  const referenced = new Set<string | null>(elements.filter((element) => element.type === 'image' && !element.isDeleted)
    .map((element) => element.type === 'image' ? element.fileId : null))
  return { elements, files: Object.fromEntries(Object.entries(files).filter(([id]) => referenced.has(id))) }
}

export function useCanvasSync(api: ExcalidrawImperativeAPI | null, roomId: string, fetchTicket: () => Promise<string>, readOnly: boolean) {
  const [status, setStatus] = useState<'connecting' | 'live' | 'reconnecting' | 'error'>('connecting')
  const [serverReadOnly, setServerReadOnly] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const socketRef = useRef<WebSocket | null>(null)
  const ready = useRef(false)
  const readOnlyRef = useRef(readOnly)
  readOnlyRef.current = readOnly || serverReadOnly
  const pending = useRef<Scene | null>(null)
  const observed = useRef('')
  const confirmedFiles = useRef<BinaryFiles>({})
  const sendTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastPointerSent = useRef(0)

  const flush = useCallback(() => {
    sendTimer.current = null
    const socket = socketRef.current
    if (!pending.current || !ready.current || readOnlyRef.current || socket?.readyState !== WebSocket.OPEN) return
    const scene = pending.current
    // Images travel once and are acknowledged with the persisted scene, rather than on every stroke.
    const files = Object.fromEntries(Object.entries(scene.files).filter(([id]) => !confirmedFiles.current[id]))
    const data = JSON.stringify({ type: 'scene', scene: { elements: scene.elements, files } })
    if (new Blob([data]).size > 8 * 1024 * 1024 - 1024) {
      setError('This whiteboard is too large to sync. Remove large images and try again.')
      return
    }
    socket.send(data)
  }, [])

  const schedule = useCallback(() => {
    if (!sendTimer.current) sendTimer.current = setTimeout(flush, 100)
  }, [flush])

  useEffect(() => {
    if (!api) return
    let stopped = false
    let retryTimer: ReturnType<typeof setTimeout> | undefined
    let retryDelay = 500
    let currentSocket: WebSocket | null = null
    let sessionId = ''
    ready.current = false
    setServerReadOnly(true)

    const retry = () => {
      if (stopped) return
      setStatus('reconnecting')
      retryTimer = setTimeout(() => { void connect() }, retryDelay)
      retryDelay = Math.min(retryDelay * 2, 10_000)
    }
    const connect = async () => {
      try {
        const ticket = await fetchTicket()
        if (stopped) return
        const url = new URL(getCanvasUrl(`/connect/${encodeURIComponent(roomId)}`, { ws: true }))
        url.searchParams.set('token', ticket)
        const socket = new WebSocket(url)
        currentSocket = socket
        socketRef.current = socket
        socket.onmessage = (event) => {
          if (stopped) return
          let message: Message
          try { message = JSON.parse(event.data as string) as Message } catch { return }
          if (!message || typeof message !== 'object') return
          if (message.type === 'error') { setError(message.message); return }
          if (message.type === 'presence' && Array.isArray(message.peers)) {
            const collaborators = new Map<SocketId, Collaborator>()
            for (const peer of message.peers) {
              if (peer.sessionId === sessionId) continue
              const color = presenceColor(peer.userId)
              collaborators.set(peer.sessionId as SocketId, {
                username: peer.name, pointer: peer.pointer ? { ...peer.pointer, tool: 'pointer' } : undefined,
                button: peer.button, selectedElementIds: peer.selectedElementIds,
                color: { background: color, stroke: color },
              })
            }
            api.updateScene({ collaborators, captureUpdate: CaptureUpdateAction.NEVER })
            return
          }
          if (message.type !== 'scene' || !message.scene || !Array.isArray(message.scene.elements) || !message.scene.files) return
          if (message.sessionId) sessionId = message.sessionId
          if (message.readonly !== undefined) {
            setServerReadOnly(message.readonly)
            readOnlyRef.current = readOnly || message.readonly
          }
          // Connections start with the full file store; later messages contain only new image bytes.
          const remote = documentScene(message.scene.elements, {
            ...(message.sessionId ? {} : confirmedFiles.current), ...message.scene.files,
          })
          const local = api.getSceneElementsIncludingDeleted()
          const elements = readOnlyRef.current ? remote.elements : reconcileElements(
            local, remote.elements as readonly RemoteExcalidrawElement[], api.getAppState(),
          )
          const files = { ...api.getFiles(), ...remote.files }
          const merged = documentScene(elements, files)
          observed.current = signature(merged)
          confirmedFiles.current = remote.files
          pending.current = !readOnlyRef.current && observed.current !== signature(remote) ? merged : null
          api.addFiles(Object.values(message.scene.files).filter((file) => !api.getFiles()[file.id]))
          api.updateScene({ elements, captureUpdate: CaptureUpdateAction.NEVER })
          ready.current = true
          setStatus('live')
          setError(null)
          retryDelay = 500
          if (pending.current) schedule()
        }
        socket.onclose = (event) => {
          if (socketRef.current === socket) socketRef.current = null
          ready.current = false
          if (stopped) return
          api.updateScene({ collaborators: new Map(), captureUpdate: CaptureUpdateAction.NEVER })
          if ([4401, 4403, 4404, 1009].includes(event.code)) {
            setStatus('error')
            setServerReadOnly(true)
            setError(event.code === 1009 ? 'This whiteboard is too large to sync.' : "You don't have access to this whiteboard anymore.")
            // Role changes revoke sockets. A new room ticket may grant different permissions.
          }
          retry()
        }
      } catch {
        if (!stopped) { setError('The whiteboard server cannot be reached. Reconnecting…'); retry() }
      }
    }
    void connect()
    return () => {
      flush()
      stopped = true
      ready.current = false
      if (retryTimer) clearTimeout(retryTimer)
      if (sendTimer.current) clearTimeout(sendTimer.current)
      sendTimer.current = null
      if (socketRef.current === currentSocket) socketRef.current = null
      currentSocket?.close()
    }
  }, [api, roomId, fetchTicket, readOnly, flush, schedule])

  const onChange: NonNullable<ExcalidrawProps['onChange']> = useCallback((elements, _appState, files) => {
    if (!ready.current || readOnlyRef.current) return
    const scene = documentScene(elements, files)
    const next = signature(scene)
    if (next === observed.current) return
    observed.current = next
    pending.current = scene
    schedule()
  }, [schedule])

  const onPointerUpdate: NonNullable<ExcalidrawProps['onPointerUpdate']> = useCallback(({ pointer, button }) => {
    const socket = socketRef.current
    if (!api || !ready.current || socket?.readyState !== WebSocket.OPEN || Date.now() - lastPointerSent.current < 50) return
    lastPointerSent.current = Date.now()
    socket.send(JSON.stringify({ type: 'presence', pointer, button, selectedElementIds: api.getAppState().selectedElementIds }))
  }, [api])

  return { status, error, onChange, onPointerUpdate, viewOnly: readOnly || serverReadOnly }
}
