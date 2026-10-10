import { useSyncExternalStore } from 'react'

export type ThemePreference = 'light' | 'dark' | 'system'
export type Theme = 'light' | 'dark'

/** Keep in sync with the pre-paint script in index.html. */
const STORAGE_KEY = 'innerview.theme'
const THEME_COLOR: Record<Theme, string> = { light: '#f7f7fb', dark: '#080a13' }
const systemQuery = () => window.matchMedia('(prefers-color-scheme: light)')

function readPreference(): ThemePreference {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved === 'light' || saved === 'dark' ? saved : 'system'
  } catch {
    return 'system'
  }
}

let preference: ThemePreference = readPreference()
const listeners = new Set<() => void>()

const resolve = (pref: ThemePreference): Theme => (pref === 'system' ? (systemQuery().matches ? 'light' : 'dark') : pref)

function apply() {
  const root = document.documentElement
  const theme = resolve(preference)
  if (root.dataset.theme !== theme) {
    // Swap every token at once instead of letting hover/color transitions animate the change.
    root.classList.add('theme-switching')
    root.dataset.theme = theme
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('theme-switching')))
  }
  document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme])
  listeners.forEach((listener) => listener())
}

// Not in the build-time prerender (no window there).
if (typeof window !== 'undefined') {
  systemQuery().addEventListener('change', () => {
    if (preference === 'system') apply()
  })
}

function setThemePreference(next: ThemePreference) {
  preference = next
  try {
    if (next === 'system') localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, next)
  } catch {
    // The choice just won't survive a reload.
  }
  apply()
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => void listeners.delete(listener)
}

/**
 * The saved preference and the theme actually shown (for third-party widgets that need it as a prop).
 * Prerendered HTML is built with the defaults (system → dark); hydration starts from those and then
 * switches to the visitor's real theme, so the markup matches.
 */
export function useTheme() {
  const current = useSyncExternalStore(subscribe, () => preference, () => 'system' as ThemePreference)
  const theme = useSyncExternalStore(subscribe, () => resolve(preference), () => 'dark' as Theme)
  return { preference: current, theme, setPreference: setThemePreference }
}
