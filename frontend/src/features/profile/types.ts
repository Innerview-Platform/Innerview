import type { EmploymentStatus, ExperienceLevel, InterviewRole } from '@/constants/enums'

/** ResumeInfo — the uploaded resume's details (never its bytes). */
export interface ResumeInfo {
  filename: string
  content_type: string
  size: number
  /** LocalDateTime (no zone) */
  uploaded_at: string | null
}

/** Rating and interview numbers shown on profiles (from user_stats). */
export interface ProfileStats {
  /** Null until the first review. */
  average_rating: number | null
  total_reviews: number
  total_interviews: number
  interviews_as_candidate: number
  interviews_as_interviewer: number
}

/** Fields shared by your own profile and other people's public profiles. */
export interface ProfileFields extends ProfileStats {
  user_id: string
  /** Null for older and Google accounts until they complete their profile. */
  username: string | null
  name: string
  headline: string | null
  employment_status: EmploymentStatus | null
  company: string | null
  university: string | null
  college: string | null
  experience_level: ExperienceLevel | null
  preferred_role: InterviewRole | null
  bio: string | null
  location: string | null
  timezone: string | null
  linkedin_url: string | null
  github_url: string | null
  portfolio_url: string | null
  /** 512 px photo; `avatar_thumb_url` is 128 px. Null when no photo. */
  avatar_url: string | null
  avatar_thumb_url: string | null
  /** LocalDateTime (no zone) */
  member_since: string | null
}

/** MyProfileResponse — GET/PUT /api/profile/me. */
export interface UserProfile extends ProfileFields {
  email: string
  show_email: boolean
  /** False for Google-only accounts. */
  has_password: boolean
  resume: ResumeInfo | null
  /** False for older and Google accounts until username, university, college and employment are filled in. */
  profile_complete: boolean
}

/** PublicProfileResponse — GET /api/profile/{username}. `email` is null unless the user shares it. */
export interface PublicProfile extends ProfileFields {
  email: string | null
}

/**
 * UpdateProfileRequest — PUT /api/profile/me. Omitted/null fields are left unchanged; an empty string
 * clears an optional text field.
 */
export interface ProfilePayload {
  username?: string
  name?: string
  headline?: string
  employment_status?: EmploymentStatus
  company?: string
  university?: string
  college?: string
  experience_level?: ExperienceLevel | null
  preferred_role?: InterviewRole | null
  bio?: string
  location?: string
  timezone?: string
  linkedin_url?: string
  github_url?: string
  portfolio_url?: string
  show_email?: boolean
}

/** AvatarResponse */
export interface AvatarUrls {
  avatar_url: string | null
  avatar_thumb_url: string | null
}

/** UserAverageRatingResponse */
export interface UserRating {
  user_id: string
  average_rating: number
  total_reviews: number
}
