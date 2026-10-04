import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getSignalingUrl } from '@/constants/config'
import type { InterviewRole } from '@/constants/enums'
import { roomKeys } from '@/features/room/hooks/useRoom'
import { createRoomSocket, type RoomSocket } from '@/features/room/realtime/roomSocket'
import type { ActiveRoom, CodeUpdatePayload, ConnectionStatus, OutgoingSignalType } from '@/features/room/types'

type CodeListener = (payload: CodeUpdatePayload) => void
type JoinListener = (userId: string) => void

interface UseRoomRealtimeOptions {
  roomId: string
  currentUserId: string
  accessToken: string | null
  /** False until the REST join succeeded, and again once the user has left. */
  enabled: boolean
}

const REFRESH_DEBOUNCE_MS = 250
/** ROLE_UPDATE from a non-owner fails silently server-side; no broadcast within this window means it was rejected. */
const ROLE_UPDATE_TIMEOUT_MS = 4_000

export function useRoomRealtime({ roomId, currentUserId, accessToken, enabled }: UseRoomRealtimeOptions) {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<ConnectionStatus>('idle')
  const [failureReason, setFailureReason] = useState<string | null>(null)
  const [connectionAttempt, setConnectionAttempt] = useState(0)

  const socketRef = useRef<RoomSocket | null>(null)
  const codeListeners = useRef(new Set<CodeListener>())
  const joinListeners = useRef(new Set<JoinListener>())
  const pendingRoleUpdates = useRef(new Map<string, ReturnType<typeof setTimeout>>())
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!enabled || !accessToken) return

    const refreshRoomState = () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current)
      refreshTimer.current = setTimeout(() => queryClient.invalidateQueries({ queryKey: roomKeys.state(roomId) }), REFRESH_DEBOUNCE_MS)
    }

    const socket = createRoomSocket({
      url: getSignalingUrl(),
      roomId,
      accessToken,
      onStatusChange: (next, reason) => {
        setStatus(next)
        setFailureReason(reason ?? null)
      },
      onConnected: () => {
        socket.send('JOIN')
      },
      onRoomEvent: (event) => {
        if (event.userId === currentUserId) return
        refreshRoomState()
        if (event.kind === 'participant-connected') joinListeners.current.forEach((listener) => listener(event.userId))
      },
      onCode: (payload) => codeListeners.current.forEach((listener) => listener(payload)),
      onRoleChange: ({ userId, newRole }) => {
        const pending = pendingRoleUpdates.current.get(userId)
        if (pending) {
          clearTimeout(pending)
          pendingRoleUpdates.current.delete(userId)
        }
        queryClient.setQueryData<ActiveRoom>(roomKeys.state(roomId), (room) => {
          const participant = room?.participants[userId]
          if (!room || !participant) return room
          return { ...room, participants: { ...room.participants, [userId]: { ...participant, role: newRole as InterviewRole } } }
        })
      },
      onFeatureAvailable: refreshRoomState,
    })
    socketRef.current = socket

    const pendingUpdates = pendingRoleUpdates.current
    return () => {
      socketRef.current = null
      if (refreshTimer.current) clearTimeout(refreshTimer.current)
      pendingUpdates.forEach(clearTimeout)
      pendingUpdates.clear()
      void socket.disconnect()
      setStatus('idle')
    }
  }, [enabled, accessToken, roomId, currentUserId, queryClient, connectionAttempt])

  const send = useCallback((type: OutgoingSignalType, payload?: unknown) => socketRef.current?.send(type, payload) ?? false, [])

  const subscribeCode = useCallback((listener: CodeListener) => {
    codeListeners.current.add(listener)
    return () => void codeListeners.current.delete(listener)
  }, [])

  const subscribeParticipantJoined = useCallback((listener: JoinListener) => {
    joinListeners.current.add(listener)
    return () => void joinListeners.current.delete(listener)
  }, [])

  const changeRole = useCallback(
    (targetUserId: string, newRole: InterviewRole) => {
      if (!send('ROLE_UPDATE', { targetUserId, newRole })) {
        toast.error('Not connected', { description: 'Reconnect to the room to change roles.' })
        return
      }
      const existing = pendingRoleUpdates.current.get(targetUserId)
      if (existing) clearTimeout(existing)
      pendingRoleUpdates.current.set(
        targetUserId,
        setTimeout(() => {
          pendingRoleUpdates.current.delete(targetUserId)
          toast.error("Role wasn't changed", { description: 'Only the person who created the room can change roles.' })
        }, ROLE_UPDATE_TIMEOUT_MS),
      )
    },
    [send],
  )

  const reconnect = useCallback(() => setConnectionAttempt((n) => n + 1), [])

  return { status, failureReason, send, subscribeCode, subscribeParticipantJoined, changeRole, reconnect }
}

export type RoomRealtime = ReturnType<typeof useRoomRealtime>
