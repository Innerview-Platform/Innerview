import { apiClient } from '@/lib/axios'
import type { PageParams, SpringPage } from '@/types/api'
import type { TicketResult } from '@/features/room/types'
import type {
  CreatedInterview,
  FeedbackForm,
  FeedbackView,
  Invite,
  Invitee,
  InterviewDetails,
  SubmitFeedbackPayload,
  UpcomingInterview,
  InstantInterviewPayload,
  InterviewHistoryFilters,
  InterviewHistoryItem,
  ScheduledInterviewPayload,
} from '@/features/interviews/types'

export const interviewsApi = {
  /**
   * GET /api/profile/me/interviews — the signed-in user's history, newest first. `userId` only scopes
   * the cache key. (GET /api/interviews/user/{userId}/history is a stub that returns a plain string.)
   */
  async getHistory(_userId: string, { status, type, page, limit }: InterviewHistoryFilters & PageParams) {
    const { data } = await apiClient.get<SpringPage<InterviewHistoryItem>>('/api/profile/me/interviews', {
      params: { status, type, page, limit },
    })
    return data
  },

  async createInstant(payload: InstantInterviewPayload): Promise<CreatedInterview> {
    const { data } = await apiClient.post<CreatedInterview>('/api/interviews/instant', payload)
    return data
  },

  async createScheduled(payload: ScheduledInterviewPayload): Promise<CreatedInterview> {
    const { data } = await apiClient.post<CreatedInterview>('/api/interviews/scheduled', payload)
    return data
  },

  /** GET /api/interviews/upcoming — hosted or invited, not ended (live first). */
  async getUpcoming(): Promise<UpcomingInterview[]> {
    const { data } = await apiClient.get<UpcomingInterview[]>('/api/interviews/upcoming')
    return data
  },

  async getDetails(id: number | string): Promise<InterviewDetails> {
    const { data } = await apiClient.get<InterviewDetails>(`/api/interviews/${id}`)
    return data
  },

  async cancel(id: number): Promise<void> {
    await apiClient.patch(`/api/interviews/${id}/cancel`)
  },

  async listInvites(id: number): Promise<Invite[]> {
    const { data } = await apiClient.get<Invite[]>(`/api/interviews/${id}/invites`)
    return data
  },

  async invite(id: number, invitees: Invitee[]): Promise<Invite[]> {
    const { data } = await apiClient.post<Invite[]>(`/api/interviews/${id}/invites`, { invitees })
    return data
  },

  async revokeInvite(id: number, inviteId: number): Promise<void> {
    await apiClient.delete(`/api/interviews/${id}/invites/${inviteId}`)
  },

  /** Downloads the interview's .ics calendar file. */
  async downloadCalendar(id: number): Promise<void> {
    const { data } = await apiClient.get<Blob>(`/api/interviews/${id}/calendar.ics`, { responseType: 'blob' })
    const url = URL.createObjectURL(data)
    const link = document.createElement('a')
    link.href = url
    link.download = `interview-${id}.ics`
    link.click()
    URL.revokeObjectURL(url)
  },

  async getFeedbackForm(id: number | string): Promise<FeedbackForm> {
    const { data } = await apiClient.get<FeedbackForm>(`/api/interviews/${id}/feedback`)
    return data
  },

  async submitFeedback(id: number | string, payload: SubmitFeedbackPayload): Promise<FeedbackView> {
    const { data } = await apiClient.post<FeedbackView>(`/api/interviews/${id}/feedback`, payload)
    return data
  },

  /** Read-only ticket for the summary page (documents, whiteboard, replay). */
  async reviewTicket(id: number | string): Promise<TicketResult> {
    const { data } = await apiClient.post<TicketResult>(`/api/interviews/${id}/review-ticket`)
    return data
  },
}
