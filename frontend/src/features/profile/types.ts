import type { ExperienceLevel, InterviewRole } from '@/constants/enums'

/** UserProfileResponse */
export interface UserProfile {
  id: number
  user_id: string
  experience_level: ExperienceLevel | null
  preferred_role: InterviewRole | null
  bio: string | null
  image_url: string | null
  /** LocalDateTime (no zone) */
  created_at: string | null
}

/** CreateProfileRequest — used by both POST and PUT /api/profile. Null fields are ignored on update. */
export interface ProfilePayload {
  experience_level?: ExperienceLevel | null
  preferred_role?: InterviewRole | null
  bio?: string | null
  image_url?: string | null
}

/** UserAverageRatingResponse */
export interface UserRating {
  user_id: string
  average_rating: number
  total_reviews: number
}
