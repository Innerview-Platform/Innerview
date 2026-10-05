import { useEffect, useRef, useState, type FormEvent } from 'react'
import { MessageSquare, SendHorizontal } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { Spinner } from '@/components/common/Spinner'
import { TextInput } from '@/components/forms/controls'
import type { RoomChat } from '@/features/room/hooks/useRoomChat'
import { cn } from '@/lib/utils'

const URL_PATTERN = /(https?:\/\/[^\s]+)/g
const IS_URL = /^https?:\/\//

function Linkified({ text }: { text: string }) {
  return (
    <>
      {text.split(URL_PATTERN).map((part, index) =>
        IS_URL.test(part) ? (
          <a key={index} href={part} target="_blank" rel="noreferrer noopener" className="break-all underline underline-offset-2">
            {part}
          </a>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  )
}

const timeOf = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

/** Room chat — saved with the interview, so it shows up on the summary afterwards. */
export function ChatPanel({ chat, currentUserId }: { chat: RoomChat; currentUserId: string }) {
  const { messages, loading, canSend, send } = chat
  const [draft, setDraft] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [messages.length])

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    const text = draft.trim()
    if (text && send(text)) setDraft('')
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col" aria-label="Chat">
      <div ref={listRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4" role="log" aria-live="polite">
        {loading ? (
          <div className="flex justify-center py-8 text-fg-muted">
            <Spinner size="sm" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center px-4 py-10 text-center">
            <MessageSquare className="mb-3 h-5 w-5 text-fg-muted" aria-hidden />
            <p className="text-sm font-medium">No messages yet</p>
            <p className="mt-1 text-xs text-fg-muted">Everyone in the room sees messages here. They're saved with the interview.</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const mine = message.senderId === currentUserId
            const grouped = index > 0 && messages[index - 1].senderId === message.senderId
            return (
              <div key={message.id} className={cn('flex flex-col', mine ? 'items-end' : 'items-start', grouped && '-mt-2')}>
                {!grouped && (
                  <span className="mb-1 text-[11px] text-fg-muted">
                    <span className="font-medium text-fg-secondary">{mine ? 'You' : message.senderName}</span> · {timeOf(message.sentAt)}
                  </span>
                )}
                <p
                  className={cn(
                    'max-w-[85%] rounded-2xl px-3 py-1.5 text-[13.5px] leading-snug break-words whitespace-pre-wrap',
                    mine ? 'rounded-br-md bg-primary text-on-primary' : 'rounded-bl-md bg-elevated text-fg',
                  )}
                >
                  <Linkified text={message.text} />
                </p>
              </div>
            )
          })
        )}
      </div>
      <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-border p-3">
        <label htmlFor="chat-input" className="sr-only">
          Message
        </label>
        <TextInput
          id="chat-input"
          data-autofocus
          value={draft}
          maxLength={2000}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={canSend ? 'Message everyone' : 'Reconnecting…'}
          autoComplete="off"
          className="min-w-0 flex-1"
        />
        <Button type="submit" size="icon" className="h-10 w-10" disabled={!draft.trim() || !canSend} aria-label="Send message">
          <SendHorizontal className="h-4 w-4" />
        </Button>
      </form>
    </section>
  )
}
