import { useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Mail } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/common/Button'
import { CopyButton } from '@/components/common/CopyButton'
import { Select, TextInput } from '@/components/forms/controls'
import { Modal } from '@/components/modals/Modal'
import { interviewsApi } from '@/features/interviews/api/interviewsApi'
import type { RoomRole } from '@/features/room/types'
import { ROOM_ROLE_HINTS, ROOM_ROLE_LABELS } from '@/features/room/utils/labels'
import { getErrorMessage } from '@/lib/apiError'
import { paths } from '@/routes/paths'

interface InviteDialogProps {
  open: boolean
  onClose: () => void
  interviewId: number
  code: string
}

/** Invite by email (joins without the lobby) or copy the link (asks to join, depending on the room's access). */
export function InviteDialog({ open, onClose, interviewId, code }: InviteDialogProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<RoomRole>('INTERVIEWEE')
  const link = `${window.location.origin}${paths.room(code)}`

  const invite = useMutation({
    mutationFn: () => interviewsApi.invite(interviewId, [{ email: email.trim(), role }]),
    onSuccess: () => {
      toast.success('Invitation sent', { description: `${email.trim()} can join without waiting in the lobby.` })
      setEmail('')
    },
    onError: (error) => toast.error("Couldn't send the invitation", { description: getErrorMessage(error) }),
  })

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (email.trim()) invite.mutate()
  }

  return (
    <Modal open={open} onClose={onClose} title="Invite people" description="Invited people join directly. Anyone else with the link has to ask.">
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <label htmlFor="invite-email" className="sr-only">
            Email
          </label>
          <TextInput id="invite-email" type="email" required placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <label htmlFor="invite-role" className="sr-only">
            Role
          </label>
          <Select id="invite-role" className="sm:w-44" value={role} onChange={(e) => setRole(e.target.value as RoomRole)}>
            {(Object.keys(ROOM_ROLE_LABELS) as RoomRole[]).map((value) => (
              <option key={value} value={value}>
                {ROOM_ROLE_LABELS[value]}
              </option>
            ))}
          </Select>
        </div>
        <p className="text-xs text-fg-muted">{ROOM_ROLE_HINTS[role]}</p>
        <Button type="submit" loading={invite.isPending} leftIcon={<Mail className="h-4 w-4" />} className="w-full sm:w-auto">
          Send invitation
        </Button>
      </form>
      <div className="mt-5 flex items-center gap-2 rounded-lg border border-border bg-bg px-3 py-2">
        <span className="min-w-0 flex-1 truncate font-mono text-[13px] text-fg-secondary">{link}</span>
        <CopyButton value={link} label="Copy link" size="sm" variant="secondary" />
      </div>
    </Modal>
  )
}
