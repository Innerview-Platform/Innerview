import { apiClient } from '@/lib/axios'
import { isApiErrorStatus } from '@/lib/apiError'
import type { ProfilePayload, UserProfile, UserRating } from '@/features/profile/types'

export const profileApi = {
  /** GET /api/profile — a 404 means the user has not created a profile yet, which we model as `null`. */
  async getMine(): Promise<UserProfile | null> {
    try {
      const { data } = await apiClient.get<UserProfile>('/api/profile')
      return data
    } catch (error) {
      if (isApiErrorStatus(error, 404)) return null
      throw error
    }
  },

  async create(payload: ProfilePayload): Promise<UserProfile> {
    const { data } = await apiClient.post<UserProfile>('/api/profile', payload)
    return data
  },

  /**
   * PUT /api/profile. Also used for photo changes: PATCH /api/profile/image never persists its change
   * and PATCH is not an allowed CORS method on the backend.
   */
  async update(payload: ProfilePayload): Promise<UserProfile> {
    const { data } = await apiClient.put<UserProfile>('/api/profile', payload)
    return data
  },

  async remove(): Promise<void> {
    await apiClient.delete('/api/profile')
  },

  /** GET /api/profile/{userId}/rating — requires that user to have a profile (404 otherwise). */
  async getRating(userId: string): Promise<UserRating> {
    const { data } = await apiClient.get<UserRating>(`/api/profile/${userId}/rating`)
    return data
  },
}
