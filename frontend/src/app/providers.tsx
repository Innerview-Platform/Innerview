import type { ReactNode } from 'react'
import { Provider as ReduxProvider } from 'react-redux'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { store } from '@/app/store'
import { AuthBootstrap } from '@/features/auth/components/AuthBootstrap'
import { SessionWatcher } from '@/features/auth/components/SessionWatcher'
import { queryClient } from '@/lib/queryClient'
import { useTheme } from '@/lib/theme'
import { useToasterPlacement } from '@/lib/toaster'

function ThemedToaster() {
  const { theme } = useTheme()
  const inRoom = useToasterPlacement() === 'room'
  return (
    <Toaster
      theme={theme}
      position={inRoom ? 'top-center' : 'bottom-right'}
      // In the interview room: in the header's empty middle, so toasts never cover faces, code or controls.
      offset={inRoom ? { top: 8 } : undefined}
      mobileOffset={inRoom ? { top: 8 } : undefined}
      closeButton
      toastOptions={{
        style: { background: 'var(--color-elevated)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' },
      }}
    />
  )
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <SessionWatcher />
        <AuthBootstrap>{children}</AuthBootstrap>
        <ThemedToaster />
      </QueryClientProvider>
    </ReduxProvider>
  )
}
