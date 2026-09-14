import { Users } from 'lucide-react'
import { Avatar } from '@/components/common/Avatar'
import { Badge } from '@/components/common/Badge'
import { Select } from '@/components/forms/controls'
import { INTERVIEW_ROLE_LABELS, INTERVIEW_ROLES, type InterviewRole } from '@/constants/enums'
import type { RoomParticipant } from '@/features/room/types'
import { cn, shortId } from '@/lib/utils'

interface ParticipantsPanelProps {
  participants: RoomParticipant[]
  currentUserId: string
  currentUserEmail: string
  onChangeRole: (userId: string, role: InterviewRole) => void
  canChangeRoles: boolean
}

export function ParticipantsPanel({ participants, currentUserId, currentUserEmail, onChangeRole, canChangeRoles }: ParticipantsPanelProps) {
  const sorted = [...participants].sort((a, b) => (a.userId === currentUserId ? -1 : b.userId === currentUserId ? 1 : a.joinedAt.localeCompare(b.joinedAt)))

  return (
    <section className="rounded-xl border border-border bg-surface" aria-label="Participants">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Users className="h-4 w-4 text-fg-muted" aria-hidden /> Participants
        </h2>
        <span className="text-xs text-fg-muted">{participants.length}</span>
      </div>
      <ul className="divide-y divide-border-subtle">
        {sorted.map((participant) => {
          const isMe = participant.userId === currentUserId
          const connected = participant.status === 'CONNECTED'
          return (
            <li key={participant.userId} className="flex items-center gap-3 px-4 py-3">
              <span className="relative">
                <Avatar label={isMe ? currentUserEmail : participant.userId} size={32} />
                <span
                  className={cn('absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-surface', connected ? 'bg-success' : 'bg-fg-muted')}
                  aria-label={connected ? 'Connected' : 'Disconnected'}
                />
              </span>
              <div className="min-w-0 flex-1">
                {/* The room API exposes user ids only, not names. */}
                <p className="truncate text-[13px] font-medium">{isMe ? 'You' : `Participant ${shortId(participant.userId)}`}</p>
                {!(canChangeRoles && !isMe) && <Badge tone={participant.role === 'INTERVIEWER' ? 'primary' : 'success'}>{INTERVIEW_ROLE_LABELS[participant.role]}</Badge>}
              </div>
              {canChangeRoles && !isMe && (
                <>
                  <label htmlFor={`role-${participant.userId}`} className="sr-only">
                    Role for participant {shortId(participant.userId)}
                  </label>
                  <Select
                    id={`role-${participant.userId}`}
                    className="h-8 w-auto text-xs"
                    value={participant.role}
                    onChange={(e) => onChangeRole(participant.userId, e.target.value as InterviewRole)}
                  >
                    {INTERVIEW_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {INTERVIEW_ROLE_LABELS[role]}
                      </option>
                    ))}
                  </Select>
                </>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
