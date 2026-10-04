export const paths = {
  root: '/',
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  /** Must match the link built by GmailEmailService: `${frontend.url}/reset-password?token=...` */
  resetPassword: '/reset-password',
  dashboard: '/dashboard',
  interviews: '/interviews',
  newInterview: '/interviews/new',
  feedback: '/feedback',
  profile: '/profile',
  joinRoom: '/room/join',
  /** Must match the link built by InterviewServiceImpl: `${frontend.url}/room/join/{roomId}` */
  room: (roomId: string) => `/room/join/${encodeURIComponent(roomId)}`,
} as const
