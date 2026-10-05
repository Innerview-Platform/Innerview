import { useSyncExternalStore } from 'react'

/** `room`: inside an interview, toasts go top-center under the header, clear of video and controls. */
type ToasterPlacement = 'app' | 'room'

let placement: ToasterPlacement = 'app'
const listeners = new Set<() => void>()

export function setToasterPlacement(next: ToasterPlacement) {
  placement = next
  listeners.forEach((listener) => listener())
}

export function useToasterPlacement() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => void listeners.delete(listener)
    },
    () => placement,
  )
}
