import { useEffect, useRef, type RefObject } from 'react'

/** Clicks here never dismiss a popover: toggle buttons, dialogs it opened, toasts, hover cards. */
const KEEP_OPEN = '[data-popover-trigger], [role="dialog"][aria-modal="true"], [data-sonner-toaster], [data-keep-popover]'

/**
 * Popover behavior: focuses the panel (or its `[data-autofocus]` element) when opened, closes on
 * Escape or a click outside, and gives focus back to where it was when it closes. A modal opened
 * from inside the panel handles its own Escape and clicks.
 */
export function useDismiss(open: boolean, panelRef: RefObject<HTMLElement | null>, onClose: () => void) {
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!open) return
    const returnFocus = document.activeElement as HTMLElement | null
    const panel = panelRef.current
    ;(panel?.querySelector<HTMLElement>('[data-autofocus]') ?? panel)?.focus({ preventScroll: true })

    const modalOpen = () => [...document.querySelectorAll('[role="dialog"][aria-modal="true"]')].some((dialog) => dialog !== panel)
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !modalOpen()) onCloseRef.current()
    }
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Element | null
      if (!target || panel?.contains(target) || modalOpen()) return
      const keep = target.closest(KEEP_OPEN)
      if (keep && keep !== panel) return
      onCloseRef.current()
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
      if (panel?.contains(document.activeElement)) returnFocus?.focus?.({ preventScroll: true })
    }
  }, [open, panelRef])
}
