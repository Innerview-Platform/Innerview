import type { AccessPolicy, RoomRole } from '@/features/room/types'

export const ROOM_ROLE_LABELS: Record<RoomRole, string> = {
  INTERVIEWER: 'Interviewer',
  INTERVIEWEE: 'Candidate',
  OBSERVER: 'Observer',
}

export const ROOM_ROLE_HINTS: Record<RoomRole, string> = {
  INTERVIEWER: 'Co-host: can admit and remove people, sees private notes, can end the interview',
  INTERVIEWEE: 'Solves the problem',
  OBSERVER: 'Watches and listens; can’t edit, run code or draw',
}

export const ACCESS_POLICY_LABELS: Record<AccessPolicy, { label: string; hint: string }> = {
  ASK_TO_JOIN: { label: 'Ask to join', hint: 'Invited people join directly; others ask and wait to be let in' },
  INVITE_ONLY: { label: 'Invited only', hint: 'Only invited people can join' },
  OPEN: { label: 'Anyone with the link', hint: 'Anyone with the link joins without asking' },
}
