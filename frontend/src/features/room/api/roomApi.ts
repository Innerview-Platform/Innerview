import { config } from '@/constants/config'
import { apiClient } from '@/lib/axios'
import type {
  AccessInfo,
  AccessPolicy,
  AccessRequest,
  ChatMessage,
  CodeRuntime,
  JoinResult,
  RoomRole,
  RoomState,
  TicketResult,
} from '@/features/room/types'

const roomPath = (code: string) => `/api/rooms/${encodeURIComponent(code)}`

export const roomApi = {
  /** GET /access — what the pre-join screen shows and whether this user can join directly. */
  async access(code: string): Promise<AccessInfo> {
    const { data } = await apiClient.get<AccessInfo>(`${roomPath(code)}/access`)
    return data
  },

  /** POST /join — enter the room (invited, admitted, host or open room); returns a room ticket. */
  async join(code: string): Promise<JoinResult> {
    const { data } = await apiClient.post<JoinResult>(`${roomPath(code)}/join`)
    return data
  },

  /** POST /ticket — a fresh room ticket (they last 5 minutes; sockets fetch one per (re)connect). */
  async ticket(code: string): Promise<TicketResult> {
    const { data } = await apiClient.post<TicketResult>(`${roomPath(code)}/ticket`)
    return data
  },

  async state(code: string): Promise<RoomState> {
    const { data } = await apiClient.get<RoomState>(`${roomPath(code)}/state`)
    return data
  },

  /** "Ask to join". */
  async knock(code: string): Promise<AccessRequest> {
    const { data } = await apiClient.post<AccessRequest>(`${roomPath(code)}/knock`)
    return data
  },

  async cancelKnock(code: string): Promise<void> {
    await apiClient.delete(`${roomPath(code)}/knock`)
  },

  async requests(code: string): Promise<AccessRequest[]> {
    const { data } = await apiClient.get<AccessRequest[]>(`${roomPath(code)}/requests`)
    return data
  },

  async admit(code: string, requestId: string, role: RoomRole = 'INTERVIEWEE'): Promise<void> {
    await apiClient.post(`${roomPath(code)}/requests/${requestId}/admit`, { role })
  },

  async deny(code: string, requestId: string): Promise<void> {
    await apiClient.post(`${roomPath(code)}/requests/${requestId}/deny`)
  },

  /** POST /leave — leave without ending the interview (idempotent). */
  async leave(code: string): Promise<void> {
    await apiClient.post(`${roomPath(code)}/leave`)
  },

  /** Leave while the page is unloading; `keepalive` lets the request outlive the document. */
  leaveOnUnload(code: string, accessToken: string) {
    try {
      void fetch(`${config.apiBaseUrl}${roomPath(code)}/leave`, {
        method: 'POST',
        keepalive: true,
        headers: { Authorization: `Bearer ${accessToken}` },
      })
    } catch {
      // Nothing useful to do while unloading.
    }
  },

  async remove(code: string, userId: string): Promise<void> {
    await apiClient.post(`${roomPath(code)}/participants/${userId}/remove`)
  },

  async changeRole(code: string, userId: string, role: RoomRole): Promise<void> {
    await apiClient.post(`${roomPath(code)}/participants/${userId}/role`, { role })
  },

  async swapRoles(code: string): Promise<void> {
    await apiClient.post(`${roomPath(code)}/swap-roles`)
  },

  async setAccessPolicy(code: string, accessPolicy: AccessPolicy): Promise<void> {
    await apiClient.patch(`${roomPath(code)}/settings`, { accessPolicy })
  },

  async extend(code: string): Promise<void> {
    await apiClient.post(`${roomPath(code)}/extend`)
  },

  async chat(code: string): Promise<ChatMessage[]> {
    const { data } = await apiClient.get<ChatMessage[]>(`${roomPath(code)}/chat`)
    return data
  },

  /** POST /end — end and save the interview for everyone (host or interviewer). */
  async end(code: string): Promise<void> {
    await apiClient.post(`${roomPath(code)}/end`)
  },

  /** GET /token — LiveKit access token for the room's video call. */
  async getSfuToken(code: string): Promise<string> {
    const { data } = await apiClient.get<{ token: string }>(`${roomPath(code)}/token`)
    return data.token
  },

  /** GET /api/code-runner/runtimes — languages installed in the code execution service. */
  async getRuntimes(): Promise<CodeRuntime[]> {
    const { data } = await apiClient.get<CodeRuntime[]>('/api/code-runner/runtimes')
    return data
  },
}
