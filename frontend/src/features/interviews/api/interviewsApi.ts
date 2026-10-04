import { apiClient } from '@/lib/axios'
import type { PageParams, SpringPage } from '@/types/api'
import type {
  CreatedInterview,
  InstantInterviewPayload,
  InterviewHistoryFilters,
  InterviewHistoryItem,
  ScheduledInterviewPayload,
} from '@/features/interviews/types'

export const interviewsApi = {
  /**
   * GET /api/profile/{userId}/interviews — paginated history, newest first.
   * (GET /api/interviews/user/{userId}/history is a stub that returns a plain string, so it is not used.)
   */
  async getHistory(userId: string, { status, type, page, limit }: InterviewHistoryFilters & PageParams) {
    const { data } = await apiClient.get<SpringPage<InterviewHistoryItem>>(`/api/profile/${userId}/interviews`, {
      params: { status, type, page, limit },
    })
    return data
  },

  async createInstant(payload: InstantInterviewPayload): Promise<CreatedInterview> {
    const { data } = await apiClient.post<CreatedInterview>('/api/interviews/instant', payload)
    return data
  },

  async createScheduled(payload: ScheduledInterviewPayload): Promise<CreatedInterview> {
    const { data } = await apiClient.post<CreatedInterview>('/api/interviews/scheduled', payload)
    return data
  },
}
