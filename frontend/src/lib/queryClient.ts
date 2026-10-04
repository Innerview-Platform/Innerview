import { QueryClient } from '@tanstack/react-query'
import { toApiError } from '@/lib/apiError'

const MAX_RETRIES = 2

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      // Client errors are deterministic; only retry network failures and 5xx responses.
      retry: (failureCount, error) => {
        const { kind, status } = toApiError(error)
        if (kind === 'network' || (status !== null && status >= 500)) return failureCount < MAX_RETRIES
        return false
      },
    },
    mutations: {
      retry: false,
    },
  },
})
