import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { roomApi } from '@/features/room/api/roomApi'
import type { RoomRealtime } from '@/features/room/hooks/useRoomRealtime'
import type { ChatMessage } from '@/features/room/types'

interface UseRoomChatOptions {
  /** Whether the chat is on screen; messages that arrive while it's closed count as unread. */
  open: boolean
  /** A message from someone else arrived while the chat was closed. */
  onIncoming?: (message: ChatMessage) => void
}

/**
 * Room chat state, kept by the room itself so the chat popup can be closed without missing messages
 * (history from the API, live messages over the room socket, unread count).
 */
export function useRoomChat(realtime: RoomRealtime, currentUserId: string, { open, onIncoming }: UseRoomChatOptions) {
  const { code, status, subscribeChat, send } = realtime
  const queryClient = useQueryClient()
  const key = useMemo(() => ['rooms', code, 'chat'] as const, [code])
  const history = useQuery({ queryKey: key, queryFn: () => roomApi.chat(code), enabled: status === 'connected', staleTime: Infinity })
  const [unread, setUnread] = useState(0)

  const openRef = useRef(open)
  const onIncomingRef = useRef(onIncoming)
  useEffect(() => {
    openRef.current = open
    onIncomingRef.current = onIncoming
  })
  if (open && unread > 0) setUnread(0)

  useEffect(
    () =>
      subscribeChat((message) => {
        queryClient.setQueryData<ChatMessage[]>(key, (current = []) => (current.some((m) => m.id === message.id) ? current : [...current, message]))
        if (message.senderId !== currentUserId && !openRef.current) {
          setUnread((n) => n + 1)
          onIncomingRef.current?.(message)
        }
      }),
    [subscribeChat, queryClient, key, currentUserId],
  )

  const sendMessage = useCallback((text: string) => send('CHAT_SEND', { text }), [send])

  return {
    messages: history.data ?? [],
    loading: status === 'connected' && history.isPending,
    unread,
    canSend: status === 'connected',
    send: sendMessage,
  }
}

export type RoomChat = ReturnType<typeof useRoomChat>
