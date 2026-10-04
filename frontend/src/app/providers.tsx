import type { ReactNode } from 'react'
import { Provider as ReduxProvider } from 'react-redux'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { store } from '@/app/store'
import { SessionWatcher } from '@/features/auth/components/SessionWatcher'
import { queryClient } from '@/lib/queryClient'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <SessionWatcher />
        {children}
        <Toaster
          theme="dark"
          position="bottom-right"
          closeButton
          toastOptions={{
            style: { background: 'var(--color-elevated)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' },
          }}
        />
      </QueryClientProvider>
    </ReduxProvider>
  )
}
