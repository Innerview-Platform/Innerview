import { combineSlices, configureStore, createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit'
import authSlice, { loggedOut, sessionExpired, sessionStarted, sessionSynced } from '@/features/auth/slices/authSlice'
import { clearSession, saveSession } from '@/features/auth/utils/session'
import uiSlice, { savePreferences, sidebarToggled } from '@/store/uiSlice'
import { injectStore } from '@/lib/axios'
import { queryClient } from '@/lib/queryClient'

const rootReducer = combineSlices(authSlice, uiSlice)

const listener = createListenerMiddleware()

listener.startListening({
  actionCreator: sessionStarted,
  effect: (_action, api) => {
    const { accessToken, user, expiresAt } = (api.getState() as RootState).auth
    if (accessToken && user && expiresAt) saveSession({ accessToken, user, expiresAt })
  },
})

listener.startListening({
  matcher: isAnyOf(loggedOut, sessionExpired),
  effect: () => {
    clearSession()
    // Server state belongs to the previous user; drop it so nothing leaks into the next session.
    queryClient.clear()
  },
})

listener.startListening({
  actionCreator: sessionSynced,
  effect: (action) => {
    if (!action.payload.accessToken) queryClient.clear()
  },
})

listener.startListening({
  actionCreator: sidebarToggled,
  effect: (_action, api) => savePreferences((api.getState() as RootState).ui),
})

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefault) => getDefault().prepend(listener.middleware),
})

injectStore(store)

export type RootState = ReturnType<typeof rootReducer>
export type AppDispatch = typeof store.dispatch
