import { apiClient } from '@/lib/axios'
import type { PageParams, SpringPage } from '@/types/api'

/** FeedbackDto */
export interface FeedbackItem {
  rating: number
  comment: string | null
  /**
   * For received feedback this is the reviewer. For given feedback the backend fills the same
   * field with the *reviewee's* id.
   */
  reviewer_id: string
  interview_id: number
  /** LocalDateTime (no zone) */
  created_at: string | null
}

export const feedbackApi = {
  /** GET /api/profile/{userId}/feedback — optional exact `rating` filter. */
  async getReceived(userId: string, { rating, page, limit }: PageParams & { rating?: number }) {
    const { data } = await apiClient.get<SpringPage<FeedbackItem>>(`/api/profile/${userId}/feedback`, {
      params: { rating, page, limit },
    })
    return data
  },

  /** GET /api/profile/{userId}/feedback/given */
  async getGiven(userId: string, { page, limit }: PageParams) {
    const { data } = await apiClient.get<SpringPage<FeedbackItem>>(`/api/profile/${userId}/feedback/given`, {
      params: { page, limit },
    })
    return data
  },
}
