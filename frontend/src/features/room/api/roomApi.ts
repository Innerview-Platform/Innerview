import { config } from '@/constants/config'
import { apiClient } from '@/lib/axios'
import type { ActiveRoom } from '@/features/room/types'

const roomPath = (roomId: string) => `/api/rooms/${encodeURIComponent(roomId)}`

export const roomApi = {
  /**
   * POST /api/rooms/{roomId}/join — validates access, initializes the room and returns its state.
   * Idempotent for a participant who is already in the room, so it doubles as "get room state".
   */
  async join(roomId: string): Promise<ActiveRoom> {
    const { data } = await apiClient.post<ActiveRoom>(`${roomPath(roomId)}/join`)
    return data
  },

  /** POST /api/rooms/{roomId}/leave */
  async leave(roomId: string): Promise<void> {
    await apiClient.post(`${roomPath(roomId)}/leave`)
  },

  /** Leave while the page is unloading; `keepalive` lets the request outlive the document. */
  leaveOnUnload(roomId: string, accessToken: string) {
    try {
      void fetch(`${config.apiBaseUrl}${roomPath(roomId)}/leave`, {
        method: 'POST',
        keepalive: true,
        headers: { Authorization: `Bearer ${accessToken}` },
      })
    } catch {
      // Nothing useful to do while unloading.
    }
  },

  /** GET /api/rooms/{roomId}/token — LiveKit access token for the room's video session. */
  async getSfuToken(roomId: string): Promise<string> {
    const { data } = await apiClient.get<{ token: string }>(`${roomPath(roomId)}/token`)
    return data.token
  },
}
