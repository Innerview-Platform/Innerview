import { lazy, Suspense, useCallback, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarPlus, DoorOpen, MessageSquare, Star, Trash2, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { useAppSelector } from '@/app/hooks'
import { Badge } from '@/components/common/Badge'
import { Button, buttonClasses } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { CopyButton } from '@/components/common/CopyButton'
import { Spinner } from '@/components/common/Spinner'
import { ErrorState, PageLoader } from '@/components/feedback/states'
import { PageHeader } from '@/components/layout/PageHeader'
import { ConfirmDialog } from '@/components/modals/ConfirmDialog'
import { INTERVIEW_STATUS_LABELS, INTERVIEW_TYPE_LABELS, labelFor } from '@/constants/enums'
import { getCollabUrl } from '@/constants/config'
import { selectCurrentUser } from '@/features/auth/slices/authSlice'
import { interviewsApi } from '@/features/interviews/api/interviewsApi'
import { CodeReplay } from '@/features/interviews/components/CodeReplay'
import { ReadOnlyCode } from '@/features/interviews/components/ReadOnlyCode'
import { InviteDialog } from '@/features/room/components/InviteDialog'
import { ROOM_ROLE_LABELS } from '@/features/room/utils/labels'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { getErrorMessage } from '@/lib/apiError'
import { cn, formatDateTime } from '@/lib/utils'
import { paths } from '@/routes/paths'

const SharedCanvasPanel = lazy(() => import('@/features/room/components/SharedCanvasPanel').then((m) => ({ default: m.SharedCanvasPanel })))

type Tab = 'code' | 'replay' | 'problem' | 'private' | 'whiteboard' | 'chat'

function Preformatted({ text, empty }: { text: string | null; empty: string }) {
  if (!text?.trim()) return <p className="p-4 text-sm text-fg-muted">{empty}</p>
  return <pre className="h-full overflow-auto p-4 text-[13px] leading-relaxed whitespace-pre-wrap text-fg-secondary">{text}</pre>
}

/** /interviews/:id — before: details, invites, calendar; after: what happened (code, replay, notes, whiteboard, chat). */
export default function InterviewDetailsPage() {
  const { interviewId = '' } = useParams()
  const me = useAppSelector(selectCurrentUser)!
  const queryClient = useQueryClient()
  const details = useQuery({ queryKey: ['interviews', interviewId], queryFn: () => interviewsApi.getDetails(interviewId) })
  const [tab, setTab] = useState<Tab>('code')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  useDocumentTitle(details.data?.title ?? 'Interview')

  const reviewTicket = useCallback(async () => (await interviewsApi.reviewTicket(interviewId)).ticket, [interviewId])
  const loadReplay = useCallback(async () => {
    const ticket = await reviewTicket()
    const response = await fetch(`${getCollabUrl(`/replay/${details.data?.code}`, { ws: false })}?token=${encodeURIComponent(ticket)}`)
    if (!response.ok) throw new Error('replay')
    return ((await response.json()) as { updates: { at: number; update: string }[] }).updates
  }, [reviewTicket, details.data?.code])

  const cancel = useMutation({
    mutationFn: () => interviewsApi.cancel(Number(interviewId)),
    onSuccess: () => {
      toast.success('Interview cancelled')
      void queryClient.invalidateQueries({ queryKey: ['interviews'] })
    },
    onError: (error) => toast.error("Couldn't cancel", { description: getErrorMessage(error) }),
    onSettled: () => setConfirmCancel(false),
  })
  const revoke = useMutation({
    mutationFn: (inviteId: number) => interviewsApi.revokeInvite(Number(interviewId), inviteId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['interviews', interviewId] }),
  })

  if (details.isPending) return <PageLoader />
  if (!details.data) return <ErrorState error={details.error} onRetry={() => details.refetch()} retrying={details.isFetching} />

  const d = details.data
  const ended = d.status === 'COMPLETED'
  const upcoming = d.status === 'SCHEDULED' || d.status === 'STARTED'
  const link = `${window.location.origin}${paths.room(d.code)}`
  const tabs: { id: Tab; label: string; show: boolean }[] = [
    { id: 'code', label: 'Final code', show: true },
    { id: 'replay', label: 'Replay', show: true },
    { id: 'problem', label: 'Problem', show: true },
    { id: 'private', label: 'Private notes', show: d.staff },
    { id: 'whiteboard', label: 'Whiteboard', show: true },
    { id: 'chat', label: `Chat (${d.chat.length})`, show: true },
  ]

  return (
    <>
      <PageHeader
        title={d.title || `${labelFor(INTERVIEW_TYPE_LABELS, d.type)} interview`}
        description={`${labelFor(INTERVIEW_TYPE_LABELS, d.type)} · ${d.startTime ? formatDateTime(d.startTime) : ''}${d.hostName ? ` · hosted by ${d.hostName}` : ''}`}
        actions={
          <div className="flex flex-wrap gap-2">
            {ended && (
              <Link to={paths.interviewFeedback(d.id)} className={buttonClasses({ size: 'sm' })}>
                <Star className="h-4 w-4" /> Feedback
              </Link>
            )}
            {upcoming && (
              <>
                <Link to={paths.room(d.code)} className={buttonClasses({ size: 'sm' })}>
                  <DoorOpen className="h-4 w-4" /> Join
                </Link>
                <Button size="sm" variant="secondary" leftIcon={<CalendarPlus className="h-4 w-4" />} onClick={() => interviewsApi.downloadCalendar(d.id)}>
                  Add to calendar
                </Button>
              </>
            )}
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-4">
          {ended ? (
            <Card className="overflow-hidden p-0">
              <div role="tablist" className="flex flex-wrap gap-1 border-b border-border p-1.5">
                {tabs.filter((t) => t.show).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={tab === t.id}
                    onClick={() => setTab(t.id)}
                    className={cn('h-8 rounded-md px-3 text-[13px] font-medium', tab === t.id ? 'bg-elevated text-fg' : 'text-fg-muted hover:text-fg')}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="h-[560px]">
                {tab === 'code' && (d.sharedCode?.trim() ? <ReadOnlyCode value={d.sharedCode} label="Final code" /> : <Preformatted text={null} empty="No code was written." />)}
                {tab === 'replay' && <CodeReplay loadUpdates={loadReplay} />}
                {tab === 'problem' && <Preformatted text={d.problemNotes} empty="No problem statement was written." />}
                {tab === 'private' && <Preformatted text={d.interviewerNotes} empty="No private notes." />}
                {tab === 'whiteboard' && (
                  <Suspense fallback={<div className="flex h-full items-center justify-center"><Spinner /></div>}>
                    <SharedCanvasPanel roomId={d.code} fetchTicket={reviewTicket} user={{ id: me.id, name: me.email.split('@')[0] }} className="rounded-none border-0" />
                  </Suspense>
                )}
                {tab === 'chat' && (
                  <div className="h-full space-y-2 overflow-y-auto p-4">
                    {d.chat.length === 0 && <p className="text-sm text-fg-muted">No messages.</p>}
                    {d.chat.map((m) => (
                      <p key={m.id} className="text-[13px]">
                        <span className="text-fg-muted">{new Date(m.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · </span>
                        <span className="font-medium">{m.senderName}: </span>
                        <span className="whitespace-pre-wrap text-fg-secondary">{m.text}</span>
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <Card className="space-y-3 p-5">
              <p className="text-sm text-fg-secondary">
                {upcoming
                  ? d.status === 'STARTED'
                    ? 'This interview is in progress.'
                    : `Scheduled for ${d.startTime ? formatDateTime(d.startTime) : 'later'}. You can join from 10 minutes before the start.`
                  : d.status === 'GHOSTED'
                    ? 'Nobody joined this interview.'
                    : 'This interview was cancelled.'}
              </p>
              {upcoming && (
                <div className="flex items-center gap-2 rounded-lg border border-border bg-bg px-3 py-2">
                  <span className="min-w-0 flex-1 truncate font-mono text-[13px]">{link}</span>
                  <CopyButton value={link} label="Copy link" size="sm" variant="secondary" />
                </div>
              )}
            </Card>
          )}
        </div>

        <aside className="space-y-4">
          <Card className="p-4">
            <h2 className="text-sm font-semibold">Details</h2>
            <dl className="mt-3 space-y-2 text-[13px]">
              <div className="flex justify-between gap-2">
                <dt className="text-fg-muted">Status</dt>
                <dd>
                  <Badge tone={ended ? 'success' : upcoming ? 'primary' : 'neutral'}>{labelFor(INTERVIEW_STATUS_LABELS, d.status)}</Badge>
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-fg-muted">Your role</dt>
                <dd>{ROOM_ROLE_LABELS[d.myRole]}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-fg-muted">Code</dt>
                <dd className="font-mono">{d.displayCode}</dd>
              </div>
              {d.durationMinutes && (
                <div className="flex justify-between gap-2">
                  <dt className="text-fg-muted">Duration</dt>
                  <dd>{d.durationMinutes} min</dd>
                </div>
              )}
            </dl>
          </Card>

          {d.participants.length > 0 && (
            <Card className="p-4">
              <h2 className="text-sm font-semibold">Participants</h2>
              <ul className="mt-3 space-y-2 text-[13px]">
                {d.participants.map((p) => (
                  <li key={p.userId} className="flex justify-between gap-2">
                    <span className="truncate">{p.userId === me.id ? 'You' : p.name}</span>
                    <span className="text-fg-muted">{ROOM_ROLE_LABELS[p.role]}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {d.owner && upcoming && (
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Invited</h2>
                <Button size="sm" variant="ghost" className="h-7 px-2" leftIcon={<UserPlus className="h-3.5 w-3.5" />} onClick={() => setInviteOpen(true)}>
                  Invite
                </Button>
              </div>
              {d.invites.length === 0 ? (
                <p className="mt-2 text-xs text-fg-muted">Nobody yet. Invited people join without waiting in the lobby.</p>
              ) : (
                <ul className="mt-3 space-y-2 text-[13px]">
                  {d.invites.map((invite) => (
                    <li key={invite.id} className="flex items-center gap-2">
                      <span className="min-w-0 flex-1 truncate">{invite.email}</span>
                      <span className="text-xs text-fg-muted">{ROOM_ROLE_LABELS[invite.role]}</span>
                      <button type="button" className="text-fg-muted hover:text-danger" aria-label={`Remove invite for ${invite.email}`} onClick={() => revoke.mutate(invite.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {d.status === 'SCHEDULED' && !d.liveSince && (
                <Button size="sm" variant="danger" className="mt-4 w-full" onClick={() => setConfirmCancel(true)}>
                  Cancel interview
                </Button>
              )}
            </Card>
          )}

          {ended && (
            <Link to={paths.interviewFeedback(d.id)} className={cn(buttonClasses({ variant: 'secondary' }), 'w-full')}>
              <MessageSquare className="h-4 w-4" /> Give or read feedback
            </Link>
          )}
        </aside>
      </div>

      <InviteDialog
        open={inviteOpen}
        onClose={() => {
          setInviteOpen(false)
          void queryClient.invalidateQueries({ queryKey: ['interviews', interviewId] })
        }}
        interviewId={d.id}
        code={d.code}
      />
      <ConfirmDialog
        open={confirmCancel}
        title="Cancel this interview?"
        description="Invitees won't be able to join."
        confirmLabel="Cancel interview"
        tone="danger"
        loading={cancel.isPending}
        onConfirm={() => cancel.mutate()}
        onCancel={() => setConfirmCancel(false)}
      />
    </>
  )
}
