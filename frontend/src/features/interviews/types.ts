import type { InterviewRole, InterviewStatus, InterviewType, RoomSize } from '@/constants/enums'
import type { AccessPolicy, ChatMessage, RoomRole } from '@/features/room/types'

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
  interviewId: number
  /** Canonical code, e.g. "abcdefghij". */
  roomId: string
  /** "abc-defg-hij" */
  displayCode: string
  roomLink: string
}

export interface Invitee {
  email: string
  role: RoomRole
}

/** InviteDto */
export interface Invite {
  id: number
  email: string
  role: RoomRole
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'REVOKED'
  userId: string | null
  createdAt: string
}

/** UpcomingInterviewDto */
export interface UpcomingInterview {
  id: number
  code: string
  displayCode: string
  title: string | null
  type: InterviewType
  status: InterviewStatus
  startTime: string | null
  endTime: string | null
  role: RoomRole
  owner: boolean
  hostName: string | null
  live: boolean
}

/** InterviewDetailsDto */
export interface InterviewDetails {
  id: number
  code: string
  displayCode: string
  title: string | null
  type: InterviewType
  status: InterviewStatus | 'GHOSTED'
  startTime: string | null
  endTime: string | null
  liveSince: string | null
  durationMinutes: number | null
  ownerId: string
  hostName: string | null
  accessPolicy: AccessPolicy
  myRole: RoomRole
  owner: boolean
  staff: boolean
  participants: { userId: string; name: string; username: string | null; avatarThumbUrl: string | null; role: RoomRole }[]
  sharedCode: string | null
  problemNotes: string | null
  interviewerNotes: string | null
  chat: ChatMessage[]
  invites: Invite[]
}

/**
 * InstantInterviewRequest / ScheduledInterviewRequest. `roomSize` and `creatorInterviewRole` are
 * required (the request is rejected without them). The room always makes its creator the
 * interviewer, so the role is informational. `durationMinutes` is ignored (server config).
 */
export interface InstantInterviewPayload {
  interviewType: InterviewType
  roomSize: RoomSize
  creatorInterviewRole: InterviewRole
  title?: string
  accessPolicy?: AccessPolicy
  invitees?: Invitee[]
}

export interface ScheduledInterviewPayload extends InstantInterviewPayload {
  /** ISO-8601 instant */
  startTime: string
}

export interface FeedbackCriterion {
  id: string
  label: string
  description: string
}

export type HireSignal = 'STRONG_NO' | 'NO' | 'LEAN_NO' | 'LEAN_YES' | 'YES' | 'STRONG_YES'

/** FeedbackViewDto */
export interface FeedbackView {
  id: number
  reviewerId: string
  reviewerName: string
  reviewerUsername: string | null
  revieweeId: string
  revieweeName: string
  revieweeUsername: string | null
  reviewerRole: RoomRole | null
  rating: number
  comment: string | null
  scores: Record<string, number> | null
  hireSignal: HireSignal | null
  createdAt: string
}

/** FeedbackFormDto */
export interface FeedbackForm {
  interviewId: number
  interviewType: InterviewType
  status: string
  myRole: RoomRole
  reviewees: {
    userId: string
    name: string
    username: string | null
    role: RoomRole
    criteria: FeedbackCriterion[]
    hireSignal: boolean
    submitted: FeedbackView | null
  }[]
  received: FeedbackView[]
}

export interface SubmitFeedbackPayload {
  revieweeId: string
  rating: number
  comment?: string
  scores: Record<string, number>
  hireSignal?: HireSignal
}
