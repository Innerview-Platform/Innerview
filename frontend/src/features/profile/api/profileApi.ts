import { apiClient } from '@/lib/axios'
import type { AvatarUrls, ProfilePayload, PublicProfile, ResumeInfo, UserProfile } from '@/features/profile/types'

function fileForm(file: Blob, filename?: string) {
  const form = new FormData()
  form.append('file', file, filename)
  return form
}

/** Up to 5 MB on a slow connection: allow longer than the client's default 20 s. */
const UPLOAD = { timeout: 120_000 }

export const profileApi = {
  /** GET /api/profile/me — every account has one; `profile_complete` is false until required fields are set. */
  async getMine(): Promise<UserProfile> {
    const { data } = await apiClient.get<UserProfile>('/api/profile/me')
    return data
  },

  /** PUT /api/profile/me — partial update (omitted fields are unchanged). */
  async update(payload: ProfilePayload): Promise<UserProfile> {
    const { data } = await apiClient.put<UserProfile>('/api/profile/me', payload)
    return data
  },

  /** GET /api/profile/{username} — what other signed-in users see. */
  async getPublic(username: string): Promise<PublicProfile> {
    const { data } = await apiClient.get<PublicProfile>(`/api/profile/${encodeURIComponent(username)}`)
    return data
  },

  /** GET /api/profile/{userId}/rating */
  /** PUT /api/profile/me/avatar — JPEG/PNG/WebP up to 5 MB; the server crops to a square and re-encodes. */
  async uploadAvatar(image: Blob): Promise<AvatarUrls> {
    const { data } = await apiClient.put<AvatarUrls>('/api/profile/me/avatar', fileForm(image, 'avatar.jpg'), UPLOAD)
    return data
  },

  async deleteAvatar(): Promise<void> {
    await apiClient.delete('/api/profile/me/avatar')
  },

  /** PUT /api/profile/me/resume — PDF or DOCX up to 5 MB. */
  async uploadResume(file: File): Promise<ResumeInfo> {
    const { data } = await apiClient.put<ResumeInfo>('/api/profile/me/resume', fileForm(file, file.name), UPLOAD)
    return data
  },

  async deleteResume(): Promise<void> {
    await apiClient.delete('/api/profile/me/resume')
  },

  /** POST /api/profile/me/delete-account — `confirmation` is the username (or email when there is none). */
  async deleteAccount(payload: { confirmation: string; password?: string }): Promise<void> {
    await apiClient.post('/api/profile/me/delete-account', payload)
  },

  /** GET /api/profile/me/resume — fetched with the access token, so it can't be a plain link. */
  async getOwnResume(): Promise<Blob> {
    const { data } = await apiClient.get<Blob>('/api/profile/me/resume', { responseType: 'blob' })
    return data
  },

  /** A participant's resume, for interviewers while the interview is live. */
  async getParticipantResume(interviewId: number, userId: string): Promise<Blob> {
    const { data } = await apiClient.get<Blob>(`/api/interviews/${interviewId}/participants/${userId}/resume`, {
      responseType: 'blob',
    })
    return data
  },
}
