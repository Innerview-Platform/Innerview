import { useState } from 'react'
import { ArrowLeftRight, Crown, FileText, Lock, UserMinus, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar } from '@/components/common/Avatar'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { Select } from '@/components/forms/controls'
import { ConfirmDialog } from '@/components/modals/ConfirmDialog'
import { profileApi } from '@/features/profile/api/profileApi'
import { ProfileLink } from '@/features/profile/components/ProfileLink'
import { ResumePreviewModal } from '@/features/profile/components/ResumePreviewModal'
import { roomApi } from '@/features/room/api/roomApi'
import { InviteDialog } from '@/features/room/components/InviteDialog'
import type { Lobby } from '@/features/room/hooks/useLobby'
import type { RoomRealtime } from '@/features/room/hooks/useRoomRealtime'
import type { AccessPolicy, RoomParticipant, RoomRole } from '@/features/room/types'
import { ACCESS_POLICY_LABELS, ROOM_ROLE_LABELS } from '@/features/room/utils/labels'
import { getErrorMessage } from '@/lib/apiError'
import { cn } from '@/lib/utils'

interface ParticipantsPanelProps {
  realtime: RoomRealtime
  lobby: Lobby
  currentUserId: string
}

/**
 * People in the room, and the lobby: host/interviewers see who's waiting and admit or deny them.
 * The host changes roles, swaps interviewer/candidate and sets who may join.
 */
export function ParticipantsPanel({ realtime, lobby, currentUserId }: ParticipantsPanelProps) {
  const { room, me, code } = realtime
  const { waiting } = lobby
  const [inviteOpen, setInviteOpen] = useState(false)
  const [removing, setRemoving] = useState<RoomParticipant | null>(null)
  const [resumeOf, setResumeOf] = useState<RoomParticipant | null>(null)

  // ── people ───────────────────────────────────────────────────────────────
  const people = room.participants
    .filter((p) => p.status !== 'LEFT')
    .sort((a, b) => (a.userId === currentUserId ? -1 : b.userId === currentUserId ? 1 : a.joinedAt.localeCompare(b.joinedAt)))
  const leftCount = room.participants.filter((p) => p.status === 'LEFT').length
  // A full 1:1 room can't take anyone else: say so instead of offering Admit.
  const full = room.maxParticipants > 0 && people.length >= room.maxParticipants

  const run = (action: () => Promise<void>, failure: string) =>
    action().catch((error) => toast.error(failure, { description: getErrorMessage(error) }))

  return (
    <section className="flex min-h-0 flex-1 flex-col" aria-label="Participants">
      {me.staff && (
        <div className="border-b border-border px-4 py-3">
          <Button size="sm" variant="secondary" className="w-full" data-autofocus leftIcon={<UserPlus className="h-3.5 w-3.5" />} onClick={() => setInviteOpen(true)}>
            Invite people
          </Button>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto">
        {me.staff && waiting.length > 0 && (
          <div className="border-b border-border bg-warning/8 px-4 py-3">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-semibold text-warning">Waiting to join · {waiting.length}</h3>
              {waiting.length > 1 && !full && (
                <button type="button" className="text-xs font-medium text-primary hover:underline" onClick={() => waiting.forEach(lobby.admit)}>
                  Admit all
                </button>
              )}
            </div>
            <ul className="space-y-2">
              {waiting.map((request) => (
                <li key={request.id} className="flex items-center gap-2">
                  <Avatar label={request.name} size={28} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{request.name}</p>
                    <p className="truncate text-[11px] text-fg-muted">{request.email}</p>
                  </div>
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-danger" onClick={() => lobby.deny(request)}>
                    Deny
                  </Button>
                  {full ? (
                    <span className="text-[11px] text-fg-muted" title="Someone has to leave before another person can join">
                      Room full
                    </span>
                  ) : (
                    <Button size="sm" className="h-7 px-2.5" onClick={() => lobby.admit(request)}>
                      Admit
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        <ul className="divide-y divide-border-subtle">
          {people.map((p) => {
            const isMe = p.userId === currentUserId
            return (
              <li key={p.userId} className="flex items-center gap-2.5 px-4 py-3">
                <div className="relative">
                  <Avatar label={p.name} src={p.avatarThumbUrl} size={32} />
                  <span
                    className={cn('absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-surface', p.status === 'CONNECTED' ? 'bg-success' : 'bg-warning animate-pulse')}
                    title={p.status === 'CONNECTED' ? 'Connected' : 'Reconnecting…'}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate text-sm">
                    {isMe ? (
                      'You'
                    ) : (
                      <ProfileLink username={p.username} newTab className="truncate">
                        {p.name}
                      </ProfileLink>
                    )}
                    {p.host && <Crown className="h-3.5 w-3.5 text-warning" aria-label="Host" />}
                  </p>
                  <p className="text-[11px] text-fg-muted">{p.status === 'RECONNECTING' ? 'Reconnecting…' : p.owner ? 'Created the interview' : ''}</p>
                </div>
                {me.host ? (
                  <Select
                    aria-label={`Role of ${p.name}`}
                    className="h-7 w-auto py-0 text-[12px]"
                    value={p.role}
                    onChange={(e) => run(() => roomApi.changeRole(code, p.userId, e.target.value as RoomRole), "Couldn't change the role")}
                  >
                    {(Object.keys(ROOM_ROLE_LABELS) as RoomRole[]).map((role) => (
                      <option key={role} value={role}>
                        {ROOM_ROLE_LABELS[role]}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <Badge tone={p.role === 'INTERVIEWER' ? 'primary' : p.role === 'OBSERVER' ? 'neutral' : 'success'}>{ROOM_ROLE_LABELS[p.role]}</Badge>
                )}
                {me.staff && !isMe && p.role === 'INTERVIEWEE' && (
                  <button
                    type="button"
                    className="rounded p-1 text-fg-muted hover:bg-elevated hover:text-fg"
                    onClick={() => setResumeOf(p)}
                    aria-label={`View ${p.name}'s resume`}
                    title="View resume (available while the interview is running)"
                  >
                    <FileText className="h-4 w-4" />
                  </button>
                )}
                {me.staff && !isMe && !p.owner && (
                  <button
                    type="button"
                    className="rounded p-1 text-fg-muted hover:bg-elevated hover:text-danger"
                    onClick={() => setRemoving(p)}
                    aria-label={`Remove ${p.name}`}
                    title="Remove from the interview"
                  >
                    <UserMinus className="h-4 w-4" />
                  </button>
                )}
              </li>
            )
          })}
        </ul>
        {leftCount > 0 && <p className="px-4 py-2 text-[11px] text-fg-muted">{leftCount} left the interview (they can rejoin without asking).</p>}
      </div>

      {me.host && (
        <div className="space-y-2.5 border-t border-border bg-bg/40 px-4 py-3">
          <label className="flex items-center gap-2 text-xs text-fg-muted">
            <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="shrink-0">Who can join</span>
            <Select
              className="h-7 py-0 text-[12px]"
              value={room.accessPolicy}
              title={ACCESS_POLICY_LABELS[room.accessPolicy].hint}
              onChange={(e) => run(() => roomApi.setAccessPolicy(code, e.target.value as AccessPolicy), "Couldn't change who can join")}
            >
              {(Object.keys(ACCESS_POLICY_LABELS) as AccessPolicy[]).map((policy) => (
                <option key={policy} value={policy}>
                  {ACCESS_POLICY_LABELS[policy].label}
                </option>
              ))}
            </Select>
          </label>
          <Button
            size="sm"
            variant="secondary"
            className="w-full"
            leftIcon={<ArrowLeftRight className="h-3.5 w-3.5" />}
            title="Interviewer becomes the candidate and vice versa (peer practice)"
            onClick={() => run(() => roomApi.swapRoles(code), "Couldn't swap roles")}
          >
            Swap interviewer and candidate
          </Button>
        </div>
      )}

      {resumeOf && (
        <ResumePreviewModal
          open
          onClose={() => setResumeOf(null)}
          title={`${resumeOf.name}'s resume`}
          queryKey={['resume', room.interviewId, resumeOf.userId]}
          load={() => profileApi.getParticipantResume(room.interviewId, resumeOf.userId)}
        />
      )}
      <InviteDialog open={inviteOpen} onClose={() => setInviteOpen(false)} interviewId={room.interviewId} code={code} />
      <ConfirmDialog
        open={Boolean(removing)}
        title={`Remove ${removing?.name}?`}
        description="They'll be disconnected and can't rejoin this interview."
        confirmLabel="Remove"
        tone="danger"
        onConfirm={() => {
          if (removing) run(() => roomApi.remove(code, removing.userId), "Couldn't remove them")
          setRemoving(null)
        }}
        onCancel={() => setRemoving(null)}
      />
    </section>
  )
}
