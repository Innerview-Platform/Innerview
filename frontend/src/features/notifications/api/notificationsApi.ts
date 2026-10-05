import { config } from '@/constants/config'
import { apiClient } from '@/lib/axios'

export type NotificationType =
  | 'WELCOME'
  | 'INTERVIEW_SCHEDULED'
  | 'INTERVIEW_REMINDER'
  | 'INTERVIEW_INVITE'
  | 'INTERVIEW_CANCELLED'
  | 'JOIN_REQUEST'

/** InAppNotification — one inbox row. `payload` is the JSON rendered by the backend's toInAppContent(). */
interface InAppNotificationRow {
  eventId: string
  recipientId: string
  payload: string
  /** Epoch ms; part of the inbox key, so mark-read needs it. */
  createdAt: number
  read: boolean
}

/** The fields every notification type renders (others are type-specific and optional). */
export interface NotificationContent {
  type: NotificationType | string
  notificationId?: string
  title: string
  message?: string | null
  /** Absolute link to the room or interview, built from the backend's frontend.url. */
  sessionUrl?: string | null
  scheduledAt?: string | null
  createdAt?: string | null
}

export interface AppNotification extends NotificationContent {
  eventId: string
  createdAtMs: number
  read: boolean
}

export function parseContent(raw: string): NotificationContent | null {
  try {
    const content = JSON.parse(raw) as Partial<NotificationContent>
    return typeof content?.title === 'string' ? (content as NotificationContent) : null
  } catch {
    return null
  }
}

export const notificationsApi = {
  /** GET /api/notifications/history — the last 30 days. */
  async history(): Promise<AppNotification[]> {
    const { data } = await apiClient.get<InAppNotificationRow[]>('/api/notifications/history')
    return data
      .flatMap((row) => {
        const content = parseContent(row.payload)
        return content ? [{ ...content, eventId: row.eventId, createdAtMs: row.createdAt, read: row.read }] : []
      })
      .sort((a, b) => b.createdAtMs - a.createdAtMs)
  },

  /** PATCH /api/notifications/{eventId}/read?createdAt= — both identify the inbox row. */
  async markRead(notification: Pick<AppNotification, 'eventId' | 'createdAtMs'>): Promise<void> {
    await apiClient.patch(`/api/notifications/${encodeURIComponent(notification.eventId)}/read`, undefined, {
      params: { createdAt: notification.createdAtMs },
    })
  },

  /**
   * GET /api/notifications/stream (Server-Sent Events). The endpoint needs the Bearer header, which
   * EventSource can't send, so this reads the stream with fetch. Resolves when the server closes it
   * (it does so every few minutes); rejects on HTTP errors with the status attached.
   */
  async stream(token: string, signal: AbortSignal, onEvent: (event: { name: string; data: string }) => void): Promise<void> {
    const response = await fetch(`${config.apiBaseUrl}/api/notifications/stream`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'text/event-stream' },
      cache: 'no-store',
      signal,
    })
    if (!response.ok || !response.body) throw Object.assign(new Error(`Stream failed (${response.status})`), { status: response.status })

    const reader = response.body.pipeThrough(new TextDecoderStream()).getReader()
    let buffer = ''
    for (;;) {
      const { value, done } = await reader.read()
      if (done) return
      buffer += value
      // Events are separated by a blank line; keep a trailing partial event for the next chunk.
      const blocks = buffer.split(/\r?\n\r?\n/)
      buffer = blocks.pop() ?? ''
      for (const block of blocks) {
        let name = 'message'
        const data: string[] = []
        for (const line of block.split(/\r?\n/)) {
          if (line.startsWith('event:')) name = line.slice(6).trim()
          else if (line.startsWith('data:')) data.push(line.slice(5).replace(/^ /, ''))
        }
        if (data.length) onEvent({ name, data: data.join('\n') })
      }
    }
  },
}
