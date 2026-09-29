import { useCallback, useEffect, useRef, useState } from 'react'
import { getSignalingUrl } from '@/constants/config'
import { roomApi } from '@/features/room/api/roomApi'
import { createRoomSocket, type RoomSocket } from '@/features/room/realtime/roomSocket'
import type {
  ChatMessage,
  CodeRunEvent,
  ConnectionStatus,
  LobbyMessage,
  Me,
  OutgoingSignalType,
  RoomClosed,
  RoomError,
  RoomNotice,
  RoomState,
  SessionMessage,
} from '@/features/room/types'

type Listener<T> = (value: T) => void

function useListeners<T>() {
  const listeners = useRef(new Set<Listener<T>>())
  const subscribe = useCallback((listener: Listener<T>) => {
    listeners.current.add(listener)
    return () => void listeners.current.delete(listener)
  }, [])
  const emit = useCallback((value: T) => listeners.current.forEach((listener) => listener(value)), [])
  return [subscribe, emit] as const
}

interface UseRoomRealtimeOptions {
  code: string
  /** From the join call. */
  initialState: RoomState
  initialMe: Me
  initialTicket: string
  /** Take over this user's connection in other tabs ("Join here"). */
  takeover: boolean
  enabled: boolean
}

let tabId: string | null = null
function getTabId() {
  tabId ??= crypto.randomUUID()
  return tabId
}

/**
 * Live connection to an interview room: room state (participants, host, timer), chat, notices, the
 * code runner, lobby requests and per-user session events. Every (re)connect uses a fresh ticket.
 */
export function useRoomRealtime({ code, initialState, initialMe, initialTicket, takeover, enabled }: UseRoomRealtimeOptions) {
  const [status, setStatus] = useState<ConnectionStatus>('idle')
  const [failureReason, setFailureReason] = useState<string | null>(null)
  const [room, setRoom] = useState(initialState)
  const [me, setMe] = useState(initialMe)
  const [closed, setClosed] = useState<RoomClosed | null>(null)
  const [session, setSession] = useState<SessionMessage | null>(null)
  const [connectionAttempt, setConnectionAttempt] = useState(0)

  const socketRef = useRef<RoomSocket | null>(null)
  const ticketRef = useRef<string | null>(initialTicket)
  const takeoverRef = useRef(takeover)

  const [subscribeRun, emitRun] = useListeners<CodeRunEvent>()
  const [subscribeChat, emitChat] = useListeners<ChatMessage>()
  const [subscribeNotice, emitNotice] = useListeners<RoomNotice>()
  const [subscribeLobby, emitLobby] = useListeners<LobbyMessage>()
  const [subscribeError, emitError] = useListeners<RoomError>()

  /** A room ticket for the other services (Hocuspocus, tldraw); reuses the join ticket first. */
  const getTicket = useCallback(async (): Promise<string | null> => {
    const cached = ticketRef.current
    if (cached) {
      ticketRef.current = null
      return cached
    }
    try {
      const result = await roomApi.ticket(code)
      setMe({ role: result.role, host: result.host, staff: result.staff, readonly: result.readonly })
      return result.ticket
    } catch {
      return null
    }
  }, [code])

  useEffect(() => {
    if (!enabled) return
    const socket = createRoomSocket({
      url: getSignalingUrl(),
      code,
      clientId: getTabId(),
      takeover: takeoverRef.current,
      getTicket,
      onStatusChange: (next, reason) => {
        setStatus(next)
        setFailureReason(reason ?? null)
        // The server announces our own connection before we're subscribed: fetch the current state.
        if (next === 'connected') roomApi.state(code).then(setRoom).catch(() => {})
      },
      onState: setRoom,
      onChat: emitChat,
      onClosed: setClosed,
      onNotice: emitNotice,
      onRun: emitRun,
      onSession: (message) => {
        setSession(message)
        // Role changed: pick up the new permissions (the editors reconnect with a new ticket by themselves).
        if (message.type === 'PERMISSIONS') void getTicket()
      },
      onLobby: emitLobby,
      onError: emitError,
    })
    takeoverRef.current = false
    socketRef.current = socket
    return () => {
      socketRef.current = null
      void socket.disconnect()
      setStatus('idle')
    }
  }, [enabled, code, getTicket, emitChat, emitNotice, emitRun, emitLobby, emitError, connectionAttempt])

  const send = useCallback((type: OutgoingSignalType, payload?: unknown) => socketRef.current?.send(type, payload) ?? false, [])
  const reconnect = useCallback(() => setConnectionAttempt((n) => n + 1), [])
  /** Ticket fetcher for Hocuspocus / tldraw (always fresh). */
  const fetchTicket = useCallback(async () => (await roomApi.ticket(code)).ticket, [code])

  return {
    code,
    status,
    failureReason,
    room,
    me,
    closed,
    session,
    send,
    reconnect,
    fetchTicket,
    subscribeRun,
    subscribeChat,
    subscribeNotice,
    subscribeLobby,
    subscribeError,
  }
}

export type RoomRealtime = ReturnType<typeof useRoomRealtime>
