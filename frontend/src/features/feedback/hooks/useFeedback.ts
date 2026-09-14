import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { feedbackApi } from '@/features/feedback/api/feedbackApi'
import { profileKeys } from '@/features/profile/hooks/useProfile'
import type { PageParams } from '@/types/api'

export type FeedbackDirection = 'received' | 'given'

export interface FeedbackQueryParams extends PageParams {
  rating?: number
}

export const feedbackKeys = {
  list: (userId: string, direction: FeedbackDirection, params: FeedbackQueryParams) =>
    [...profileKeys.user(userId), 'feedback', direction, params] as const,
}

/** Feedback endpoints require the user to have a profile; callers pass `enabled`. */
export function useFeedback(userId: string | undefined, direction: FeedbackDirection, params: FeedbackQueryParams, enabled = true) {
  return useQuery({
    queryKey: feedbackKeys.list(userId ?? '', direction, params),
    queryFn: () =>
      direction === 'received'
        ? feedbackApi.getReceived(userId!, params)
        : feedbackApi.getGiven(userId!, { page: params.page, limit: params.limit }),
    enabled: Boolean(userId) && enabled,
    placeholderData: keepPreviousData,
  })
}
