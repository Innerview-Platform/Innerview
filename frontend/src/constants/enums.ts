// Mirrors com.innerview.spring.enums.* — values must match the backend exactly.

export const EXPERIENCE_LEVELS = ['STUDENT', 'FRESH_GRADUATE', 'JUNIOR', 'MID_LEVEL', 'SENIOR'] as const
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number]

export const INTERVIEW_ROLES = ['INTERVIEWER', 'INTERVIEWEE', 'BOTH'] as const
export type InterviewRole = (typeof INTERVIEW_ROLES)[number]

export const INTERVIEW_TYPES = ['PROBLEM_SOLVING', 'SYSTEM_DESIGN', 'HR', 'TECHNICAL'] as const
export type InterviewType = (typeof INTERVIEW_TYPES)[number]

export const INTERVIEW_STATUSES = ['SCHEDULED', 'STARTED', 'COMPLETED', 'CANCELLED'] as const
export type InterviewStatus = (typeof INTERVIEW_STATUSES)[number]

export const EXPERIENCE_LEVEL_LABELS: Record<ExperienceLevel, string> = {
  STUDENT: 'Student',
  FRESH_GRADUATE: 'Fresh graduate',
  JUNIOR: 'Junior',
  MID_LEVEL: 'Mid-level',
  SENIOR: 'Senior',
}

export const INTERVIEW_ROLE_LABELS: Record<InterviewRole, string> = {
  INTERVIEWER: 'Interviewer',
  INTERVIEWEE: 'Interviewee',
  BOTH: 'Both',
}

export const INTERVIEW_TYPE_LABELS: Record<InterviewType, string> = {
  PROBLEM_SOLVING: 'Problem solving',
  SYSTEM_DESIGN: 'System design',
  HR: 'HR / Behavioral',
  TECHNICAL: 'Technical',
}

export const INTERVIEW_TYPE_DESCRIPTIONS: Record<InterviewType, string> = {
  PROBLEM_SOLVING: 'Problem statement and a shared code editor.',
  SYSTEM_DESIGN: 'Problem statement and a system design canvas.',
  HR: 'Conversation-focused behavioral interview.',
  TECHNICAL: 'Problem statement, shared editor and canvas.',
}

export const INTERVIEW_STATUS_LABELS: Record<InterviewStatus, string> = {
  SCHEDULED: 'Scheduled',
  STARTED: 'In progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

/** Look up a label for a value the backend sent as a plain string, falling back to the raw value. */
export function labelFor<T extends string>(labels: Record<T, string>, value: string | null | undefined): string {
  if (!value) return '—'
  return (labels as Record<string, string>)[value] ?? value
}
