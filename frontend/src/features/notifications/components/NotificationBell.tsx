import { useId, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlarmClock, Bell, BellOff, CalendarCheck, CalendarX2, DoorOpen, Mail, PartyPopper, type LucideIcon } from 'lucide-react'
import { SkeletonRows } from '@/components/common/Skeleton'
import { ErrorState } from '@/components/feedback/states'
import type { AppNotification } from '@/features/notifications/api/notificationsApi'
import { appPath, useMarkRead, useNotifications } from '@/features/notifications/hooks/useNotifications'
import { useDismiss } from '@/hooks/useDismiss'
import { cn, formatRelative } from '@/lib/utils'

const TYPE_ICON: Record<string, LucideIcon> = {
  WELCOME: PartyPopper,
  INTERVIEW_SCHEDULED: CalendarCheck,
  INTERVIEW_REMINDER: AlarmClock,
  INTERVIEW_INVITE: Mail,
  INTERVIEW_CANCELLED: CalendarX2,
  JOIN_REQUEST: DoorOpen,
}

function NotificationItem({ item, onOpen }: { item: AppNotification; onOpen: (item: AppNotification) => void }) {
  const Icon = TYPE_ICON[item.type] ?? Bell
  const actionable = Boolean(appPath(item.sessionUrl)) || !item.read
  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(item)}
        disabled={!actionable}
        className={cn(
          'flex w-full gap-3 px-4 py-3 text-left transition-colors enabled:hover:bg-elevated/70 disabled:cursor-default',
          !item.read && 'bg-primary/[0.06]',
        )}
      >
        <span
          className={cn(
            'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
            item.type === 'INTERVIEW_CANCELLED' ? 'bg-danger/10 text-danger' : 'bg-primary/12 text-primary',
          )}
        >
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-start justify-between gap-2">
            <span className={cn('text-[13px] leading-snug', item.read ? 'font-medium text-fg-secondary' : 'font-semibold text-fg')}>{item.title}</span>
            {!item.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
          </span>
          {item.message && <span className="mt-0.5 block text-[13px] leading-snug text-fg-muted">{item.message}</span>}
          <span className="mt-1 block text-[11px] text-fg-muted">{formatRelative(item.createdAtMs)}</span>
        </span>
      </button>
    </li>
  )
}

/**
 * Bell with an unread badge; opens the inbox (last 30 days). `side` opens it to the right of the
 * sidebar; `below` drops it under the mobile header.
 */
export function NotificationBell({ placement = 'side', className }: { placement?: 'side' | 'below'; className?: string }) {
  const [open, setOpen] = useState(false)
  const [style, setStyle] = useState<CSSProperties>({})
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const navigate = useNavigate()
  const notifications = useNotifications()
  const markRead = useMarkRead()
  useDismiss(open, panelRef, () => setOpen(false))

  // Anchor the panel to the bell.
  useLayoutEffect(() => {
    if (!open) return
    const place = () => {
      const rect = buttonRef.current?.getBoundingClientRect()
      if (!rect) return
      setStyle(
        placement === 'side'
          ? {
              // Beside the sidebar, not over it.
              left: (buttonRef.current?.closest('aside')?.getBoundingClientRect().right ?? rect.right) + 8,
              top: Math.max(12, rect.top - 8),
              maxHeight: `calc(100dvh - ${Math.max(12, rect.top - 8) + 16}px)`,
            }
          : { right: 12, top: rect.bottom + 8, maxHeight: `calc(100dvh - ${rect.bottom + 24}px)` },
      )
    }
    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [open, placement])

  const { items, unread } = notifications
  const openItem = (item: AppNotification) => {
    if (!item.read) markRead.mutate(item)
    const path = appPath(item.sessionUrl)
    if (path) {
      setOpen(false)
      navigate(path)
    }
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        data-popover-trigger
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        title="Notifications"
        className={cn(
          'relative flex h-9 w-9 items-center justify-center rounded-lg text-fg-secondary transition-colors hover:bg-elevated hover:text-fg',
          open && 'bg-elevated text-fg',
          className,
        )}
      >
        <Bell className="h-[18px] w-[18px]" aria-hidden />
        {unread > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] leading-none font-semibold text-on-primary ring-2 ring-surface">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-labelledby={titleId}
          tabIndex={-1}
          style={style}
          className="fixed z-50 flex w-[360px] max-w-[calc(100vw-1.5rem)] animate-[popover-in_160ms_var(--ease-out-soft)_both] flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-pop outline-none"
        >
          <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-border pr-2 pl-4">
            <h2 id={titleId} className="text-sm font-semibold">
              Notifications
            </h2>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => items.filter((n) => !n.read).forEach((n) => markRead.mutate(n))}
                className="rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-elevated"
              >
                Mark all as read
              </button>
            )}
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {notifications.isPending ? (
              <SkeletonRows rows={3} className="p-4" />
            ) : notifications.isError ? (
              <ErrorState error={notifications.error} title="Couldn't load notifications" onRetry={() => notifications.refetch()} retrying={notifications.isFetching} className="py-8" />
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-10 text-center">
                <BellOff className="mb-3 h-5 w-5 text-fg-muted" aria-hidden />
                <p className="text-sm font-medium">You’re all caught up</p>
                <p className="mt-1 text-xs text-fg-muted">Invites, reminders and join requests show up here.</p>
              </div>
            ) : (
              <ul className="divide-y divide-border-subtle">
                {items.map((item) => (
                  <NotificationItem key={item.eventId} item={item} onOpen={openItem} />
                ))}
              </ul>
            )}
          </div>
          {items.length > 0 && <p className="shrink-0 border-t border-border-subtle px-4 py-2 text-[11px] text-fg-muted">Showing the last 30 days</p>}
        </div>
      )}
    </>
  )
}
