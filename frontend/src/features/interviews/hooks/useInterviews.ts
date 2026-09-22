import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'
import { interviewsApi } from '@/features/interviews/api/interviewsApi'
import { profileKeys } from '@/features/profile/hooks/useProfile'
import type { InterviewHistoryFilters } from '@/features/interviews/types'
import type { PageParams } from '@/types/api'

export const interviewKeys = {
  history: (userId: string) => [...profileKeys.user(userId), 'interviews'] as const,
  historyPage: (userId: string, params: InterviewHistoryFilters & PageParams) => [...interviewKeys.history(userId), params] as const,
}

interface HistoryOptions {
  /** History requires the user to have a profile; the backend answers 404 otherwise. */
  enabled?: boolean
}

export function useInterviewHistory(userId: string | undefined, params: InterviewHistoryFilters & PageParams, { enabled = true }: HistoryOptions = {}) {
  return useQuery({
    queryKey: interviewKeys.historyPage(userId ?? '', params),
    queryFn: () => interviewsApi.getHistory(userId!, params),
    enabled: Boolean(userId) && enabled,
    placeholderData: keepPreviousData,
  })
}

// Creating an interview does not add the creator to `user_interview` (the history source),
// so there is nothing to invalidate after these mutations.
export function useCreateInstantInterview() {
  return useMutation({ mutationFn: interviewsApi.createInstant })
}

export function useCreateScheduledInterview() {
  return useMutation({ mutationFn: interviewsApi.createScheduled })
}
