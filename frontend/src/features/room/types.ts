/** RoomUiConfig */
export interface RoomUiConfig {
  showProblemStatement: boolean
  showSharedEditor: boolean
  showSystemCanvas: boolean
}

/** Collaborative documents of a room (Hocuspocus): code, problem notes, interviewers' private notes. */
export type SharedDocumentName = 'code' | 'notes' | 'private'

export type RoomRole = 'INTERVIEWER' | 'INTERVIEWEE' | 'OBSERVER'
export type ParticipantStatus = 'CONNECTED' | 'RECONNECTING' | 'LEFT'
export type AccessPolicy = 'OPEN' | 'ASK_TO_JOIN' | 'INVITE_ONLY'

/** ParticipantDto — pushed on /topic/room/{code}/state. */
export interface RoomParticipant {
  userId: string
  name: string
  /** Null for accounts without a username yet. */
  username: string | null
  avatarThumbUrl: string | null
  role: RoomRole
  status: ParticipantStatus
  /** Currently has host rights (the owner while present, otherwise handed off). */
  host: boolean
  /** Created the interview. */
  owner: boolean
  joinedAt: string
}

/** RoomStateDto */
export interface RoomState {
  code: string
  displayCode: string
  interviewId: number
  title: string | null
  type: string | null
  uiConfig: RoomUiConfig
  ownerId: string
  hostId: string | null
  accessPolicy: AccessPolicy
  endsAt: string | null
  extended: boolean
  maxParticipants: number
  participants: RoomParticipant[]
}

/** What the pre-join screen shows (AccessInfoDto). */
export type AccessStatus =
  | 'HOST'
  | 'INVITED'
  | 'ADMITTED'
  | 'OPEN'
  | 'MUST_ASK'
  | 'PENDING'
  | 'NOT_INVITED'
  | 'DENIED'
  | 'REMOVED'
  | 'FULL'
  | 'NOT_STARTED'
  | 'ENDED'
  | 'CANCELLED'

export interface AccessInfo {
  code: string
  displayCode: string
  interviewId: number
  title: string | null
  type: string | null
  hostName: string | null
  startTime: string | null
  endTime: string | null
  accessPolicy: AccessPolicy
  access: AccessStatus
  canJoin: boolean
  role: RoomRole | null
  participantsInside: string[]
  joinOpensAt: string | null
  requestId: string | null
  alreadyConnected: boolean
}

export interface Me {
  role: RoomRole
  host: boolean
  /** Host or interviewer: admits people, sees private notes, can end. */
  staff: boolean
  readonly: boolean
}

export interface JoinResult {
  ticket: string
  room: RoomState
  me: Me
  alreadyConnected: boolean
}

export interface TicketResult extends Me {
  ticket: string
}

export interface AccessRequest {
  id: string
  userId: string
  name: string
  email: string
  requestedAt: string
  status: 'PENDING' | 'ADMITTED' | 'DENIED' | 'EXPIRED' | 'CANCELLED'
}

export interface ChatMessage {
  id: number
  senderId: string
  senderName: string
  text: string
  sentAt: string
}

/** /topic/room/{code}/close */
export interface RoomClosed {
  reason: 'ENDED_BY_HOST' | 'TIME_UP' | 'EMPTY' | 'NO_SHOW'
  message: string
  interviewId: number
}

/** /topic/room/{code}/notice */
export type RoomNotice =
  | { type: 'TIME_WARNING'; endsAt: string }
  | { type: 'EXTENDED'; endsAt: string; by: string }
  | { type: 'ROLES_SWAPPED'; by: string }

/** /user/queue/session */
export type SessionMessage =
  | { type: 'REPLACED'; room: string; clientId: string }
  | { type: 'REMOVED'; room: string; by: string }
  | { type: 'PERMISSIONS'; room: string; role: RoomRole }

/** /user/queue/lobby */
export interface LobbyMessage {
  type: 'REQUEST' | 'RESOLVED'
  room: string
  request: AccessRequest
}

/** /user/queue/errors */
export interface RoomError {
  code: string
  message: string
  room?: string
  startedBy?: string
}

/** Message types accepted by SignalingController at /app/signal.send. */
export type OutgoingSignalType = 'RUN_CODE' | 'RUN_STDIN' | 'RUN_STOP' | 'RUN_LANGUAGE' | 'RUN_SYNC' | 'CHAT_SEND'

/** CodeRunEvent — broadcast on /topic/room/{roomId}/run while the shared code runs in Piston. */
export interface CodeRunEvent {
  type: 'state' | 'language' | 'started' | 'runtime' | 'stage' | 'stdout' | 'stderr' | 'stdin' | 'exit' | 'error' | 'finished' | 'stopped'
  runId?: string
  userId?: string
  language?: string
  version?: string
  stage?: 'compile' | 'run'
  data?: string
  code?: number
  signal?: string
  running?: boolean
}

/** RuntimeDto — GET /api/code-runner/runtimes (the languages installed in Piston). */
export interface CodeRuntime {
  language: string
  version: string
  aliases: string[]
}

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'failed'
