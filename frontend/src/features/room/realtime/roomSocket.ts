import { Client, type IMessage } from '@stomp/stompjs'
import type {
  ChatMessage,
  CodeRunEvent,
  ConnectionStatus,
  LobbyMessage,
  OutgoingSignalType,
  RoomClosed,
  RoomError,
  RoomNotice,
  RoomState,
  SessionMessage,
} from '@/features/room/types'

export interface RoomSocketHandlers {
  onStatusChange: (status: ConnectionStatus, reason?: string) => void
  onState: (state: RoomState) => void
  onChat: (message: ChatMessage) => void
  onClosed: (closed: RoomClosed) => void
  onNotice: (notice: RoomNotice) => void
  onRun: (event: CodeRunEvent) => void
  onSession: (message: SessionMessage) => void
  onLobby: (message: LobbyMessage) => void
  onError: (error: RoomError) => void
}

interface RoomSocketOptions extends RoomSocketHandlers {
  url: string
  code: string
  /** Identifies this tab, so "Join here" in another tab only closes the others. */
  clientId: string
  /** Replace this user's connection in other tabs (first connect only). */
  takeover: boolean
  /** A fresh room ticket for each (re)connect; null when the user is no longer allowed in. */
  getTicket: () => Promise<string | null>
}

export interface RoomSocket {
  send: (type: OutgoingSignalType, payload?: unknown) => boolean
  disconnect: () => Promise<void>
}

const MAX_RECONNECT_ATTEMPTS = 8
/** ERROR frame messages from the server that make reconnecting pointless. */
const FATAL = new Set(['unauthorized', 'room-closed', 'not-a-member'])

function parse<T>(message: IMessage): T | null {
  try {
    return JSON.parse(message.body) as T
  } catch {
    return null
  }
}

/**
 * STOMP connection to the backend for one interview room. The CONNECT frame carries a room ticket
 * (fetched fresh before every attempt), so reconnects keep working however long the interview runs.
 */
export function createRoomSocket(options: RoomSocketOptions): RoomSocket {
  const { url, code, clientId } = options
  let failedAttempts = 0
  let takeover = options.takeover
  let stopped = false

  const client = new Client({
    brokerURL: url,
    reconnectDelay: 2_000,
    heartbeatIncoming: 10_000,
    heartbeatOutgoing: 10_000,
    debug: () => {},
  })

  const fail = (reason: string) => {
    stopped = true
    options.onStatusChange('failed', reason)
    void client.deactivate()
  }

  client.beforeConnect = async () => {
    options.onStatusChange(failedAttempts === 0 ? 'connecting' : 'reconnecting')
    const ticket = await options.getTicket()
    if (!ticket) {
      fail('not-a-member')
      return
    }
    client.connectHeaders = { ticket, clientId, ...(takeover ? { takeover: 'true' } : {}) }
    takeover = false
  }

  client.onConnect = () => {
    failedAttempts = 0
    const topic = `/topic/room/${code}`
    client.subscribe(`${topic}/state`, (m) => {
      const state = parse<RoomState>(m)
      if (state) options.onState(state)
    })
    client.subscribe(`${topic}/chat`, (m) => {
      const message = parse<ChatMessage>(m)
      if (message) options.onChat(message)
    })
    client.subscribe(`${topic}/close`, (m) => {
      const closed = parse<RoomClosed>(m)
      if (closed) options.onClosed(closed)
    })
    client.subscribe(`${topic}/notice`, (m) => {
      const notice = parse<RoomNotice>(m)
      if (notice) options.onNotice(notice)
    })
    client.subscribe(`${topic}/run`, (m) => {
      const event = parse<CodeRunEvent>(m)
      if (event?.type) options.onRun(event)
    })
    // Private queues are per user across all their rooms; keep only this room's messages.
    client.subscribe('/user/queue/session', (m) => {
      const message = parse<SessionMessage>(m)
      if (message && message.room === code) options.onSession(message)
    })
    client.subscribe('/user/queue/lobby', (m) => {
      const message = parse<LobbyMessage>(m)
      if (message && message.room === code) options.onLobby(message)
    })
    client.subscribe('/user/queue/errors', (m) => {
      const error = parse<RoomError>(m)
      if (error && (!error.room || error.room === code)) options.onError(error)
    })
    options.onStatusChange('connected')
  }

  client.onStompError = (frame) => {
    const reason = frame.headers.message ?? 'The server refused the connection'
    if ([...FATAL].some((fatal) => reason.includes(fatal))) fail(reason)
  }

  client.onWebSocketClose = () => {
    if (stopped || !client.active) return
    failedAttempts += 1
    if (failedAttempts > MAX_RECONNECT_ATTEMPTS) fail('Lost connection to the interview server')
    else options.onStatusChange('reconnecting')
  }

  client.activate()

  return {
    send(type, payload) {
      if (!client.connected) return false
      client.publish({ destination: '/app/signal.send', body: JSON.stringify({ type, roomId: code, payload: payload ?? null }) })
      return true
    },
    disconnect: () => {
      stopped = true
      return client.deactivate()
    },
  }
}
