import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAppSelector } from '@/app/hooks'
import { selectAccessToken, selectIsAuthenticated } from '@/features/auth/slices/authSlice'
import { notificationsApi, parseContent, type AppNotification } from '@/features/notifications/api/notificationsApi'
import { refreshSession } from '@/lib/axios'

export const notificationKeys = { all: ['notifications'] as const }

/** The in-app path for a backend link (it's built from the backend's configured frontend URL). */
export function appPath(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    const parsed = new URL(url, window.location.origin)
    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return null
  }
}

export function useNotifications() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const query = useQuery({
    queryKey: notificationKeys.all,
    queryFn: notificationsApi.history,
    enabled: isAuthenticated,
    staleTime: 60_000,
  })
  const items = query.data ?? []
  return { ...query, items, unread: items.filter((n) => !n.read).length }
}

export function useMarkRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (notification: AppNotification) => notificationsApi.markRead(notification),
    onMutate: (notification) => {
      queryClient.setQueryData<AppNotification[]>(notificationKeys.all, (current) =>
        current?.map((n) => (n.eventId === notification.eventId ? { ...n, read: true } : n)),
      )
    },
    onError: () => void queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  })
}

const MAX_RETRY_MS = 30_000

/**
 * Keeps the live notification stream open while signed in: reconnects with backoff (the server
 * closes streams every few minutes), follows token refreshes, stops on sign-out. New notifications
 * refresh the inbox and show one toast each.
 */
export function NotificationStream() {
  const token = useAppSelector(selectAccessToken)
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const navigateRef = useRef(navigate)
  useEffect(() => {
    navigateRef.current = navigate
  })
  const seen = useRef(new Set<string>())

  useEffect(() => {
    if (!token) return
    const controller = new AbortController()
    let retryTimer: ReturnType<typeof setTimeout> | undefined
    let delay = 1_000

    const onEvent = ({ name, data }: { name: string; data: string }) => {
      if (name === 'connected') {
        delay = 1_000
        // Catch up on anything sent while disconnected.
        void queryClient.invalidateQueries({ queryKey: notificationKeys.all })
        return
      }
      const content = parseContent(data)
      if (!content) return
      const id = content.notificationId ?? `${content.type}-${content.createdAt}`
      if (seen.current.has(id)) return
      seen.current.add(id)
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all })

      const path = appPath(content.sessionUrl)
      // Already looking at that room (e.g. a lobby request while you're inside): the room shows it.
      if (path && path === window.location.pathname) return
      toast(content.title, {
        id: `notification-${id}`,
        description: content.message ?? undefined,
        action: path ? { label: 'Open', onClick: () => navigateRef.current(path) } : undefined,
      })
    }

    const connect = async () => {
      try {
        await notificationsApi.stream(token, controller.signal, onEvent)
      } catch (error) {
        if (controller.signal.aborted) return
        // An expired token: refreshing updates the store, which restarts this effect with the new one.
        // If the token didn't actually change, the retry below tries again.
        if ((error as { status?: number }).status === 401 && !(await refreshSession())) return
        delay = Math.min(delay * 2, MAX_RETRY_MS)
      }
      if (!controller.signal.aborted) retryTimer = setTimeout(connect, delay)
    }

    void connect()
    return () => {
      controller.abort()
      clearTimeout(retryTimer)
    }
  }, [token, queryClient])

  return null
}
