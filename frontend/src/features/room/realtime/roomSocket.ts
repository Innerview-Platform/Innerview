import { Client, type IMessage } from '@stomp/stompjs'
import type { CodeUpdatePayload, ConnectionStatus, OutgoingSignalType } from '@/features/room/types'

/** Broadcasts on /topic/room/{roomId}, normalized. */
export type RoomEvent =
  | { kind: 'participant-connected'; userId: string }
  | { kind: 'participant-left'; userId: string }

export interface RoleChange {
  userId: string
  newRole: string
}

interface RoomSocketOptions {
  url: string
  roomId: string
  accessToken: string
  onStatusChange: (status: ConnectionStatus, reason?: string) => void
  /** Runs after every (re)connect, once subscriptions are in place. */
  onConnected: () => void
  onRoomEvent: (event: RoomEvent) => void
  onCode: (payload: CodeUpdatePayload) => void
  onRoleChange: (change: RoleChange) => void
  onFeatureAvailable: (feature: string) => void
}

export interface RoomSocket {
  send: (type: OutgoingSignalType, payload?: unknown) => boolean
  disconnect: () => Promise<void>
}

const MAX_RECONNECT_ATTEMPTS = 5

function parseJson(message: IMessage): unknown {
  try {
    return JSON.parse(message.body)
  } catch {
    return message.body
  }
}

function toRoomEvent(body: unknown): RoomEvent | null {
  if (!body || typeof body !== 'object') return null
  const message = body as { type?: string; userId?: string; payload?: { targetUserId?: string } }

  // WebRtcP2pImpl.join broadcasts {type: "ROLE", payload: {role, targetUserId}} whenever a user sends JOIN.
  if (message.type === 'ROLE' && message.payload?.targetUserId) {
    return { kind: 'participant-connected', userId: message.payload.targetUserId }
  }
  // RoomServiceImpl.leaveRoom sends {type: "USER_DISCONNECTED", userId}; handleDisconnect sends {userId} only.
  if ((message.type === 'USER_DISCONNECTED' || !message.type) && message.userId) {
    return { kind: 'participant-left', userId: message.userId }
  }
  // OFFER / ANSWER / ICE_CANDIDATE belong to the P2P WebRTC path; video uses LiveKit instead.
  return null
}

/**
 * STOMP connection to the Spring signaling endpoint. The CONNECT frame carries the bearer token
 * and room id as native headers, which WebSocketConfig uses to authenticate and bind the session.
 */
export function createRoomSocket(options: RoomSocketOptions): RoomSocket {
  const { url, roomId, accessToken } = options
  let failedAttempts = 0

  const client = new Client({
    brokerURL: url,
    connectHeaders: { Authorization: `Bearer ${accessToken}`, roomId },
    reconnectDelay: 2_000,
    heartbeatIncoming: 10_000,
    heartbeatOutgoing: 10_000,
    debug: () => {},
  })

  client.beforeConnect = () => {
    options.onStatusChange(failedAttempts === 0 ? 'connecting' : 'reconnecting')
  }

  client.onConnect = () => {
    failedAttempts = 0
    const topic = `/topic/room/${roomId}`
    client.subscribe(topic, (message) => {
      const event = toRoomEvent(parseJson(message))
      if (event) options.onRoomEvent(event)
    })
    client.subscribe(`${topic}/code`, (message) => {
      const body = parseJson(message) as Partial<CodeUpdatePayload> | null
      if (body && typeof body.base64Vector === 'string') {
        options.onCode({ base64Vector: body.base64Vector, plainText: body.plainText ?? '' })
      }
    })
    client.subscribe(`${topic}/roles`, (message) => {
      const body = parseJson(message) as Partial<RoleChange> | null
      if (body?.userId && body.newRole) options.onRoleChange({ userId: body.userId, newRole: body.newRole })
    })
    client.subscribe(`${topic}/ui-available`, (message) => {
      options.onFeatureAvailable(String(parseJson(message)).replace(/"/g, ''))
    })
    options.onStatusChange('connected')
    options.onConnected()
  }

  const fail = (reason: string) => {
    options.onStatusChange('failed', reason)
    void client.deactivate()
  }

  // The server rejects CONNECT (e.g. expired token) with an ERROR frame; retrying cannot succeed.
  client.onStompError = (frame) => fail(frame.headers.message || 'The server refused the connection')

  client.onWebSocketClose = () => {
    if (!client.active) return
    failedAttempts += 1
    if (failedAttempts > MAX_RECONNECT_ATTEMPTS) fail('Lost connection to the interview server')
    else options.onStatusChange('reconnecting')
  }

  client.activate()

  return {
    send(type, payload) {
      if (!client.connected) return false
      client.publish({ destination: '/app/signal.send', body: JSON.stringify({ type, roomId, payload: payload ?? null }) })
      return true
    },
    disconnect: () => client.deactivate(),
  }
}
