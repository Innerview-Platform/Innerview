import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { authApi } from '@/features/auth/api/authApi'
import { usernameFormatProblem } from '@/features/profile/validation/profileSchema'

export type UsernameStatus =
  | { state: 'idle' }
  | { state: 'unchanged' }
  | { state: 'invalid'; message: string }
  | { state: 'checking' }
  | { state: 'available'; username: string }
  | { state: 'taken'; message: string }
  | { state: 'error' }

const DEBOUNCE_MS = 350

/**
 * Live username check while typing: format is checked instantly, uniqueness after a short pause
 * (results are cached per username). `currentUsername` is the user's own, which is always fine.
 */
export function useUsernameAvailability(value: string, currentUsername?: string | null): UsernameStatus {
  const normalized = value.trim().toLowerCase()
  const formatProblem = normalized ? usernameFormatProblem(normalized) : null
  const unchanged = Boolean(currentUsername) && normalized === currentUsername
  const shouldCheck = Boolean(normalized) && !formatProblem && !unchanged

  const [debounced, setDebounced] = useState(normalized)
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(normalized), DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [normalized])

  const query = useQuery({
    queryKey: ['username-available', debounced],
    queryFn: () => authApi.checkUsername(debounced),
    enabled: shouldCheck && debounced === normalized,
    staleTime: 30_000,
    retry: false,
  })

  if (!normalized) return { state: 'idle' }
  if (formatProblem) return { state: 'invalid', message: formatProblem }
  if (unchanged) return { state: 'unchanged' }
  if (debounced !== normalized || query.isPending) return { state: 'checking' }
  if (query.isError) return { state: 'error' }
  return query.data.available
    ? { state: 'available', username: query.data.username }
    : { state: 'taken', message: query.data.reason ?? 'This username is already taken.' }
}
