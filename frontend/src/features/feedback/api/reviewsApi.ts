import { apiClient } from '@/lib/axios'
import type { InterviewType } from '@/constants/enums'
import type { SpringPage } from '@/types/api'

export type HireSignal = 'STRONG_NO' | 'NO' | 'LEAN_NO' | 'LEAN_YES' | 'YES' | 'STRONG_YES'
export type ReviewDirection = 'received' | 'given'

/** The other person: the reviewer (received) or the reviewee (given). */
export interface ReviewPerson {
  user_id: string
  username: string | null
  name: string
  avatar_thumb_url: string | null
}

export interface ReviewInterview {
  id: number
  title: string | null
  type: InterviewType | null
  start_time: string | null
}

/** ReviewSummaryDto */
export interface ReviewSummary {
  id: number
  person: ReviewPerson
  reviewer_role: 'INTERVIEWER' | 'INTERVIEWEE' | 'OBSERVER' | 'BOTH' | null
  rating: number
  /** First ~160 characters of the comment. */
  excerpt: string | null
  hire_signal: HireSignal | null
  interview: ReviewInterview
  /** LocalDateTime (no zone) */
  created_at: string | null
}

/** ReviewDetailDto */
export interface ReviewDetail extends Omit<ReviewSummary, 'excerpt'> {
  comment: string | null
  scores: { id: string; label: string; description: string | null; score: number }[]
}

export const reviewsApi = {
  /** GET /api/profile/me/reviews — reviews about you (only ever your own). */
  async received({ rating, page, size }: { rating?: number; page: number; size: number }) {
    const { data } = await apiClient.get<SpringPage<ReviewSummary>>('/api/profile/me/reviews', { params: { rating, page, size } })
    return data
  },

  /** GET /api/profile/me/reviews/given — reviews you wrote. */
  async given({ page, size }: { page: number; size: number }) {
    const { data } = await apiClient.get<SpringPage<ReviewSummary>>('/api/profile/me/reviews/given', { params: { page, size } })
    return data
  },

  async detail(id: number): Promise<ReviewDetail> {
    const { data } = await apiClient.get<ReviewDetail>(`/api/profile/me/reviews/${id}`)
    return data
  },
}
