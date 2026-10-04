import type { InterviewStatus, InterviewType } from '@/constants/enums'

/** InterviewHistoryDto */
export interface InterviewHistoryItem {
  interview_id: number
  /** InterviewType name */
  type: string
  /** Instant (UTC) */
  start_time: string | null
  duration_minutes: number | null
  /** InterviewRole name of the user in that interview */
  role: string
}

export interface InterviewHistoryFilters {
  status?: InterviewStatus
  type?: InterviewType
}

/** InterviewResponse */
export interface CreatedInterview {
  roomId: string
  roomLink: string
}

/**
 * InstantInterviewRequest / ScheduledInterviewRequest. The backend currently ignores
 * `creatorInterviewRole` and `durationMinutes` (duration comes from server config), so only
 * the fields it reads are sent.
 */
export interface InstantInterviewPayload {
  interviewType: InterviewType
}

export interface ScheduledInterviewPayload {
  interviewType: InterviewType
  /** ISO-8601 instant */
  startTime: string
}
