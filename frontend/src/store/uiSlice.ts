import { createSlice } from '@reduxjs/toolkit'

const PREFERENCES_KEY = 'innerview.preferences'

export interface UiState {
  /** Persisted preference: collapsed desktop sidebar. */
  sidebarCollapsed: boolean
  /** Transient: mobile navigation drawer. */
  mobileNavOpen: boolean
}

function loadPreferences(): Pick<UiState, 'sidebarCollapsed'> {
  try {
    const raw = localStorage.getItem(PREFERENCES_KEY)
    const parsed = raw ? (JSON.parse(raw) as Partial<UiState>) : {}
    return { sidebarCollapsed: Boolean(parsed.sidebarCollapsed) }
  } catch {
    return { sidebarCollapsed: false }
  }
}

export function savePreferences(state: UiState) {
  try {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify({ sidebarCollapsed: state.sidebarCollapsed }))
  } catch {
    // ignore
  }
}

const uiSlice = createSlice({
  name: 'ui',
  initialState: (): UiState => ({ ...loadPreferences(), mobileNavOpen: false }),
  reducers: {
    sidebarToggled(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed
    },
    mobileNavOpened(state) {
      state.mobileNavOpen = true
    },
    mobileNavClosed(state) {
      state.mobileNavOpen = false
    },
  },
  selectors: {
    selectSidebarCollapsed: (state) => state.sidebarCollapsed,
    selectMobileNavOpen: (state) => state.mobileNavOpen,
  },
})

export const { sidebarToggled, mobileNavOpened, mobileNavClosed } = uiSlice.actions
export const { selectSidebarCollapsed, selectMobileNavOpen } = uiSlice.selectors
export default uiSlice
