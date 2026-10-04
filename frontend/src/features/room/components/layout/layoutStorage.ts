import type { LayoutStorage } from 'react-resizable-panels'

/** Remembers panel sizes per browser; storage can be unavailable (private mode, blocked site data). */
export const layoutStorage: LayoutStorage = {
  getItem(key) {
    try {
      return window.localStorage.getItem(key)
    } catch {
      return null
    }
  },
  setItem(key, value) {
    try {
      window.localStorage.setItem(key, value)
    } catch {
      // Sizes just won't be remembered.
    }
  },
}
