import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { SendHorizontal } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { roomApi } from '@/features/room/api/roomApi'
import type { RoomRealtime } from '@/features/room/hooks/useRoomRealtime'
import type { ChatMessage } from '@/features/room/types'
import { cn } from '@/lib/utils'

const URL_PATTERN = /(https?:\/\/[^\s]+)/g
const IS_URL = /^https?:\/\//

function Linkified({ text }: { text: string }) {
  return (
    <>
      {text.split(URL_PATTERN).map((part, index) =>
        IS_URL.test(part) ? (
          <a key={index} href={part} target="_blank" rel="noreferrer noopener" className="text-primary-hover underline break-all">
            {part}
          </a>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  )
}

/** Room chat — saved with the interview, so it shows up on the summary afterwards. */
export function ChatPanel({ realtime, currentUserId, onUnread }: { realtime: RoomRealtime; currentUserId: string; onUnread?: () => void }) {
  const { code } = realtime
  const queryClient = useQueryClient()
  const key = ['rooms', code, 'chat'] as const
  const history = useQuery({ queryKey: key, queryFn: () => roomApi.chat(code), enabled: realtime.status === 'connected', staleTime: Infinity })
  const [draft, setDraft] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const onUnreadRef = useRef(onUnread)
  useEffect(() => {
    onUnreadRef.current = onUnread
  })

  useEffect(
    () =>
      realtime.subscribeChat((message) => {
        queryClient.setQueryData<ChatMessage[]>(['rooms', code, 'chat'], (current = []) =>
          current.some((m) => m.id === message.id) ? current : [...current, message],
        )
        if (message.senderId !== currentUserId) onUnreadRef.current?.()
      }),
    [realtime.subscribeChat, queryClient, code, currentUserId],
  )

  const messages = history.data ?? []
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [messages.length])

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    const text = draft.trim()
    if (!text) return
    if (realtime.send('CHAT_SEND', { text })) setDraft('')
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col" aria-label="Chat">
      <div ref={listRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3" role="log" aria-live="polite">
        {messages.length === 0 && <p className="py-6 text-center text-xs text-fg-muted">Messages are visible to everyone in the room and saved with the interview.</p>}
        {messages.map((message, index) => {
          const mine = message.senderId === currentUserId
          const grouped = index > 0 && messages[index - 1].senderId === message.senderId
          return (
            <div key={message.id} className={cn('flex flex-col', mine ? 'items-end' : 'items-start')}>
              {!grouped && (
                <span className="mb-0.5 text-[11px] text-fg-muted">
                  {mine ? 'You' : message.senderName} · {new Date(message.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              <p className={cn('max-w-[90%] rounded-lg px-2.5 py-1.5 text-[13px] whitespace-pre-wrap break-words', mine ? 'bg-primary/20' : 'bg-elevated')}>
                <Linkified text={message.text} />
              </p>
            </div>
          )
        })}
      </div>
      <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-border p-2">
        <label htmlFor="chat-input" className="sr-only">
          Message
        </label>
        <input
          id="chat-input"
          value={draft}
          maxLength={2000}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Send a message"
          autoComplete="off"
          className="min-w-0 flex-1 rounded-lg border border-border bg-elevated px-3 py-1.5 text-[13px] outline-none focus:border-primary"
        />
        <Button type="submit" size="icon" className="h-8 w-8" disabled={!draft.trim() || realtime.status !== 'connected'} aria-label="Send">
          <SendHorizontal className="h-4 w-4" />
        </Button>
      </form>
    </section>
  )
}
