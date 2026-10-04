import type { InterviewRole } from '@/constants/enums'

/** RoomUiConfig */
export interface RoomUiConfig {
  showProblemStatement: boolean
  showSharedEditor: boolean
  showSystemCanvas: boolean
}

/** RoomParticipant (Lombok serializes `isAudioMuted` as `audioMuted`). */
export interface RoomParticipant {
  userId: string
  roomId: string
  role: InterviewRole
  status: 'CONNECTED' | 'DISCONNECTED'
  joinedAt: string
  audioMuted: boolean
  videoMuted: boolean
}

/** ActiveRoomDto — returned by POST /api/rooms/{roomId}/join */
export interface ActiveRoom {
  roomId: string
  uiConfig: RoomUiConfig
  participants: Record<string, RoomParticipant>
}

/** CodeUpdatePayload — `base64Vector` carries a full Yjs state update. */
export interface CodeUpdatePayload {
  base64Vector: string
  plainText: string
}

/** Message types accepted by SignalingController at /app/signal.send (WebRTC P2P types are unused). */
export type OutgoingSignalType = 'JOIN' | 'JOIN_FEATURE' | 'ROLE_UPDATE' | 'CODE_UPDATE' | 'COMPILE_CODE'

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'failed'
