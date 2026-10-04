import { formatCode } from '@/features/room/utils/roomCode'

export const paths = {
  /** Home (dashboard) when signed in. */
  home: '/',
  login: '/login',
  signup: '/signup',
  forgotPassword: '/forgot-password',
  /** Must match the link built by GmailEmailService: `${frontend.url}/reset-password?token=...` */
  resetPassword: '/reset-password',
  interviews: '/interviews',
  newInterview: '/interviews/new',
  interview: (id: number | string) => `/interviews/${id}`,
  interviewFeedback: (id: number | string) => `/interviews/${id}/feedback`,
  feedback: '/feedback',
  settings: '/settings/profile',
  join: '/join',
  /** Must match the links built by the backend: `${frontend.url}/abc-defg-hij` */
  room: (code: string) => `/${formatCode(code)}`,
} as const
