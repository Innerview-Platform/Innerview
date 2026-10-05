import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { useDismiss } from '@/hooks/useDismiss'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/utils'

const EXIT_MS = 140

interface RoomPopoverProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  /** Small text next to the title (e.g. "2 of 2"). */
  meta?: ReactNode
  /** Distance from the right edge on larger screens, to sit beside the video column (px). */
  rightOffset?: number
  children: ReactNode
}

/**
 * A panel that opens above the room's control bar (bottom sheet on phones) for things you need now
 * and then — chat, people — so they don't take permanent space from the workspace. It sits left of
 * the video column (`rightOffset`) so it never covers faces. Closes on Escape or a click outside,
 * and gives focus back to the button that opened it.
 */
export function RoomPopover({ open, onClose, title, meta, rightOffset, children }: RoomPopoverProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const isSheet = !useMediaQuery('(min-width: 640px)')
  const [mounted, setMounted] = useState(open)
  if (open && !mounted) setMounted(true)

  // Keep the panel mounted while it animates out.
  useEffect(() => {
    if (open || !mounted) return
    const timer = setTimeout(() => setMounted(false), EXIT_MS)
    return () => clearTimeout(timer)
  }, [open, mounted])

  useDismiss(open, panelRef, onClose)

  if (!mounted) return null

  return (
    <>
      {isSheet && (
        <div
          className={cn('fixed inset-0 z-40 bg-overlay', open ? 'animate-[overlay-in_160ms_ease-out_both]' : 'animate-[overlay-out_140ms_ease-in_both]')}
          aria-hidden
        />
      )}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal={isSheet}
        aria-labelledby={titleId}
        tabIndex={-1}
        style={!isSheet && rightOffset ? { right: rightOffset } : undefined}
        className={cn(
          'fixed z-40 flex flex-col overflow-hidden border border-border bg-surface shadow-pop outline-none',
          isSheet
            ? 'inset-x-0 bottom-0 h-[min(78dvh,640px)] rounded-t-2xl'
            : 'right-3 bottom-[calc(var(--room-bar-height)+0.5rem)] h-[min(560px,calc(100dvh-var(--room-bar-height)-5rem))] w-[380px] max-w-[calc(100vw-1.5rem)] origin-bottom-right rounded-xl',
          open
            ? isSheet
              ? 'animate-[sheet-in_220ms_var(--ease-out-soft)_both]'
              : 'animate-[popover-in_160ms_var(--ease-out-soft)_both]'
            : isSheet
              ? 'animate-[sheet-out_140ms_ease-in_both]'
              : 'animate-[popover-out_140ms_ease-in_both]',
        )}
      >
        {isSheet && <span className="mx-auto mt-2 h-1 w-9 shrink-0 rounded-full bg-border" aria-hidden />}
        <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-border pr-2 pl-4">
          <h2 id={titleId} className="flex items-baseline gap-2 text-sm font-semibold">
            {title}
            {meta && <span className="text-xs font-normal text-fg-muted">{meta}</span>}
          </h2>
          <button type="button" onClick={onClose} className="rounded-md p-1.5 text-fg-muted hover:bg-elevated hover:text-fg" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </header>
        {children}
      </div>
    </>
  )
}
