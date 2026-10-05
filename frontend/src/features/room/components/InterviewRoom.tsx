import { lazy, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { FileText, LayoutPanelLeft, MessageSquare, PanelLeft, PanelRight, PhoneOff, Users, Video, type LucideIcon } from 'lucide-react'
import { Group, Panel, useDefaultLayout, usePanelRef } from 'react-resizable-panels'
import { toast } from 'sonner'
import { useAppSelector } from '@/app/hooks'
import { Button } from '@/components/common/Button'
import { Spinner } from '@/components/common/Spinner'
import { Alert } from '@/components/feedback/Alert'
import { ConfirmDialog } from '@/components/modals/ConfirmDialog'
import { Modal } from '@/components/modals/Modal'
import { selectAccessToken, selectCurrentUser } from '@/features/auth/slices/authSlice'
import { roomApi } from '@/features/room/api/roomApi'
import { CallControls } from '@/features/room/components/call/CallControls'
import { CallProvider, type DevicePreferences } from '@/features/room/components/call/CallProvider'
import { VideoStage } from '@/features/room/components/call/VideoStage'
import { ChatPanel } from '@/features/room/components/ChatPanel'
import { layoutStorage } from '@/features/room/components/layout/layoutStorage'
import { ResizeHandle } from '@/features/room/components/layout/ResizeHandle'
import { ParticipantsPanel } from '@/features/room/components/ParticipantsPanel'
import { RoomHeader } from '@/features/room/components/RoomHeader'
import { RoomPopover } from '@/features/room/components/RoomPopover'
import { WorkspaceTabs, type WorkspaceTab } from '@/features/room/components/WorkspaceTabs'
import { useCollabDocument } from '@/features/room/hooks/useCollabDocument'
import { useLobby } from '@/features/room/hooks/useLobby'
import { useRoomChat } from '@/features/room/hooks/useRoomChat'
import { useRoomRealtime } from '@/features/room/hooks/useRoomRealtime'
import { useSharedProblem } from '@/features/room/hooks/useSharedProblem'
import type { JoinResult, RoomUiConfig } from '@/features/room/types'
import { ROOM_ROLE_LABELS } from '@/features/room/utils/labels'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { getErrorMessage } from '@/lib/apiError'
import { setToasterPlacement } from '@/lib/toaster'
import { cn } from '@/lib/utils'
import { paths } from '@/routes/paths'

// Heavy dependencies (CodeMirror, Excalidraw) load only inside the room.
const ProblemPanel = lazy(() => import('@/features/room/components/ProblemPanel').then((m) => ({ default: m.ProblemPanel })))
const CodeEditorPanel = lazy(() => import('@/features/room/components/CodeEditorPanel').then((m) => ({ default: m.CodeEditorPanel })))
const SharedCanvasPanel = lazy(() => import('@/features/room/components/SharedCanvasPanel').then((m) => ({ default: m.SharedCanvasPanel })))

/** System-design rooms open on the whiteboard; everything else opens on the code editor. */
const defaultTab = (uiConfig: RoomUiConfig): WorkspaceTab => (uiConfig.showSystemCanvas && !uiConfig.showSharedEditor ? 'whiteboard' : 'code')

type MobileView = 'problem' | 'workspace' | 'call'
type Popup = 'people' | 'chat'

const MOBILE_VIEWS: { id: MobileView; label: string; icon: LucideIcon }[] = [
  { id: 'problem', label: 'Problem', icon: FileText },
  { id: 'workspace', label: 'Workspace', icon: LayoutPanelLeft },
  { id: 'call', label: 'Call', icon: Video },
]

function PanelFallback({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center rounded-xl border border-border bg-surface text-fg-muted', className)}>
      <Spinner />
    </div>
  )
}

/** Shows or hides one of the side panels (desktop). */
function PanelToggle({ icon: Icon, label, pressed, onClick }: { icon: LucideIcon; label: string; pressed: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      title={`${pressed ? 'Hide' : 'Show'} ${label.toLowerCase()}`}
      className={cn(
        'flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-medium transition-colors',
        pressed ? 'text-fg hover:bg-elevated' : 'text-fg-muted hover:bg-elevated hover:text-fg',
      )}
    >
      <Icon className={cn('h-4 w-4', pressed && 'text-primary')} aria-hidden />
      <span className="hidden xl:inline">{label}</span>
    </button>
  )
}

/** People / Chat buttons in the control bar; the count turns into a badge when something needs attention. */
function PopupToggle({ icon: Icon, label, count, alert, pressed, onClick }: { icon: LucideIcon; label: string; count?: number; alert?: number; pressed: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      data-popover-trigger
      onClick={onClick}
      aria-expanded={pressed}
      aria-label={`${label}${alert ? ` (${alert} new)` : ''}`}
      title={label}
      className={cn(
        'relative flex h-10 items-center gap-2 rounded-full px-3 text-[13px] font-medium transition-colors md:px-3.5',
        pressed ? 'bg-primary/15 text-fg ring-1 ring-primary/35' : 'bg-elevated text-fg hover:bg-border',
      )}
    >
      <Icon className={cn('h-[18px] w-[18px]', pressed && 'text-primary')} aria-hidden />
      <span className="hidden md:inline">{label}</span>
      {alert ? (
        <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-semibold text-on-primary ring-2 ring-surface md:static md:ring-0">
          {alert}
        </span>
      ) : (
        count !== undefined && <span className="hidden text-fg-muted tabular-nums md:inline">{count}</span>
      )}
    </button>
  )
}

interface InterviewRoomProps {
  joined: JoinResult
  devices: DevicePreferences
  takeover: boolean
  /** Rejoin from the "you joined from another tab" screen. */
  onRejoin: () => void
}

export function InterviewRoom({ joined, devices, takeover, onRejoin }: InterviewRoomProps) {
  const navigate = useNavigate()
  const authUser = useAppSelector(selectCurrentUser)!
  const accessToken = useAppSelector(selectAccessToken)
  const [hasLeft, setHasLeft] = useState(false)
  const code = joined.room.code

  const realtime = useRoomRealtime({
    code,
    initialState: joined.room,
    initialMe: joined.me,
    initialTicket: joined.ticket,
    takeover,
    enabled: !hasLeft,
  })
  const { room, me } = realtime
  const myName = room.participants.find((p) => p.userId === authUser.id)?.name ?? authUser.email.split('@')[0]
  const user = useMemo(() => ({ id: authUser.id, name: myName }), [authUser.id, myName])
  const people = useMemo(() => new Map(room.participants.map((p) => [p.userId, p])), [room.participants])
  const present = room.participants.filter((p) => p.status !== 'LEFT').length
  const inviteLink = `${window.location.origin}${paths.room(code)}`

  // The shared problem document, used by the problem panel and (for the selected library problem) the editor.
  const problemDoc = useCollabDocument({ code, kind: 'notes', fetchTicket: realtime.fetchTicket, user })
  const sharedProblem = useSharedProblem(problemDoc.doc, problemDoc.text)

  // ── layout ───────────────────────────────────────────────────────────────
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [tab, setTab] = useState<WorkspaceTab | null>(null)
  const activeTab = tab ?? defaultTab(room.uiConfig)
  const [whiteboardMounted, setWhiteboardMounted] = useState(false)
  if (activeTab === 'whiteboard' && !whiteboardMounted) setWhiteboardMounted(true)
  const [mobileView, setMobileView] = useState<MobileView>('workspace')

  const problemPanel = usePanelRef()
  const callPanel = usePanelRef()
  const roomLayout = useDefaultLayout({ id: 'innerview-room-layout-v2', storage: layoutStorage })
  const [problemOpen, setProblemOpen] = useState(() => (roomLayout.defaultLayout?.problem ?? 1) > 0)
  const [callOpen, setCallOpen] = useState(() => (roomLayout.defaultLayout?.call ?? 1) > 0)
  const togglePanel = (panel: typeof problemPanel, open: boolean) => (open ? panel.current?.collapse() : panel.current?.expand())

  // Popups open beside the video column rather than over it (column + room padding + resize gap).
  const [videoColumnWidth, setVideoColumnWidth] = useState(0)
  const popoverRight = isDesktop && videoColumnWidth > 0 ? videoColumnWidth + 12 + 10 : undefined

  // ── chat & people (popups) ───────────────────────────────────────────────
  const [popup, setPopup] = useState<Popup | null>(null)
  const togglePopup = (next: Popup) => setPopup((current) => (current === next ? null : next))
  const lobby = useLobby(realtime)
  const chat = useRoomChat(realtime, user.id, {
    open: popup === 'chat',
    onIncoming: (message) =>
      toast(message.senderName, {
        id: `chat-${message.id}`,
        description: message.text.length > 140 ? `${message.text.slice(0, 140)}…` : message.text,
        action: { label: 'Reply', onClick: () => setPopup('chat') },
      }),
  })

  // Toasts move under the header while the room is open.
  useEffect(() => {
    setToasterPlacement('room')
    return () => setToasterPlacement('app')
  }, [])

  // ── leaving ──────────────────────────────────────────────────────────────
  const leftRef = useRef(false)
  const tokenRef = useRef(accessToken)
  useEffect(() => {
    tokenRef.current = accessToken
  })

  // Closing the tab or reloading: leave explicitly (presence also times out after 60 s).
  useEffect(() => {
    const onPageHide = () => {
      if (!leftRef.current && tokenRef.current) roomApi.leaveOnUnload(code, tokenRef.current)
    }
    window.addEventListener('pagehide', onPageHide)
    return () => window.removeEventListener('pagehide', onPageHide)
  }, [code])

  // Navigating away inside the app. Deferred so React StrictMode's simulated unmount doesn't leave the room.
  const pendingLeave = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => {
    clearTimeout(pendingLeave.current)
    return () => {
      pendingLeave.current = setTimeout(() => {
        if (leftRef.current) return
        leftRef.current = true
        roomApi.leave(code).catch(() => {})
      }, 0)
    }
  }, [code])

  const exit = (to: string) => {
    leftRef.current = true
    setHasLeft(true)
    navigate(to, { replace: true })
  }

  const leave = useMutation({ mutationFn: () => roomApi.leave(code), onSettled: () => exit(paths.home) })
  const [leaveDialog, setLeaveDialog] = useState(false)
  const [endDialog, setEndDialog] = useState(false)
  const endInterview = useMutation({
    mutationFn: () => roomApi.end(code),
    onSuccess: () => {
      toast.success('Interview ended and saved')
      exit(paths.interviewFeedback(room.interviewId))
    },
    onError: (error) => toast.error("Couldn't end the interview", { description: getErrorMessage(error) }),
    onSettled: () => {
      setEndDialog(false)
      setLeaveDialog(false)
    },
  })

  // Host and interviewers can also end the interview from here (on phones it's the only place).
  const onLeaveClick = () => (me.staff ? setLeaveDialog(true) : leave.mutate())

  // ── server events ────────────────────────────────────────────────────────
  const endingLocally = endInterview.isPending || endInterview.isSuccess
  useEffect(() => {
    if (!realtime.closed || endingLocally || leftRef.current) return
    toast.info('Interview ended', { description: realtime.closed.message })
    exit(paths.interviewFeedback(realtime.closed.interviewId))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realtime.closed, endingLocally])

  useEffect(() => {
    const message = realtime.session
    if (!message) return
    if (message.type === 'REMOVED') {
      toast.error('You were removed from the interview', { description: `By ${message.by}` })
      exit(paths.home)
    } else if (message.type === 'PERMISSIONS') {
      toast.info(`You're now ${ROOM_ROLE_LABELS[message.role].toLowerCase()}`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realtime.session])

  useEffect(
    () =>
      realtime.subscribeNotice((notice) => {
        if (notice.type === 'TIME_WARNING') toast.warning('5 minutes left', { description: 'Start wrapping up.' })
        if (notice.type === 'EXTENDED') toast.info(`${notice.by} added 15 minutes`)
        if (notice.type === 'ROLES_SWAPPED') toast.info('Interviewer and candidate swapped', { description: `By ${notice.by}` })
      }),
    [realtime.subscribeNotice],
  )

  useEffect(
    () =>
      realtime.subscribeError((error) => {
        if (error.code !== 'RUN_BUSY') toast.error(error.message)
      }),
    [realtime.subscribeError],
  )

  // Another tab took over this user's seat ("Join here").
  if (realtime.session?.type === 'REPLACED') {
    return (
      <Modal
        open
        onClose={() => exit(paths.home)}
        title="You joined from another tab"
        description="This interview is open in another tab or device, so this one was disconnected."
        dismissible={false}
        footer={
          <>
            <Button variant="secondary" onClick={() => exit(paths.home)}>
              Leave this tab
            </Button>
            <Button onClick={onRejoin}>Use here instead</Button>
          </>
        }
      />
    )
  }

  // ── zones ────────────────────────────────────────────────────────────────
  const tabs = <WorkspaceTabs value={activeTab} onChange={setTab} />

  const problem = (
    <Suspense fallback={<PanelFallback className="h-full" />}>
      <ProblemPanel realtime={realtime} user={user} problemDoc={problemDoc} shared={sharedProblem} />
    </Suspense>
  )

  const workspace = (
    <div className="h-full min-h-0">
      <div className={cn('h-full', activeTab !== 'code' && 'hidden')}>
        <Suspense fallback={<PanelFallback className="h-full" />}>
          <CodeEditorPanel realtime={realtime} user={user} header={tabs} problem={sharedProblem.problem} />
        </Suspense>
      </div>
      {whiteboardMounted && (
        <div className={cn('h-full', activeTab !== 'whiteboard' && 'hidden')}>
          <Suspense fallback={<PanelFallback className="h-full" />}>
            <SharedCanvasPanel roomId={code} fetchTicket={realtime.fetchTicket} header={tabs} />
          </Suspense>
        </div>
      )}
    </div>
  )

  let body: ReactNode
  if (isDesktop) {
    body = (
      <Group
        orientation="horizontal"
        id="innerview-room-layout-v2"
        className="min-h-0 flex-1 px-3 pt-3"
        defaultLayout={roomLayout.defaultLayout}
        onLayoutChanged={roomLayout.onLayoutChanged}
      >
        <Panel id="problem" panelRef={problemPanel} collapsible collapsedSize="0%" defaultSize="22%" minSize="260px" maxSize="40%" onResize={(size) => setProblemOpen(size.asPercentage > 0)}>
          {problem}
        </Panel>
        <ResizeHandle />
        <Panel id="workspace" minSize="35%">
          {workspace}
        </Panel>
        <ResizeHandle />
        <Panel
          id="call"
          panelRef={callPanel}
          collapsible
          collapsedSize="0%"
          defaultSize="22%"
          minSize="240px"
          maxSize="38%"
          onResize={(size) => {
            setCallOpen(size.asPercentage > 0)
            setVideoColumnWidth(Math.round(size.inPixels))
          }}
        >
          <VideoStage variant="column" people={people} selfId={user.id} inviteLink={inviteLink} />
        </Panel>
      </Group>
    )
  } else {
    body = (
      <>
        <nav className="flex shrink-0 gap-1 border-b border-border bg-surface px-3 py-2" aria-label="Room views">
          {MOBILE_VIEWS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setMobileView(id)}
              aria-current={mobileView === id ? 'page' : undefined}
              className={cn(
                'flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg text-[13px] font-medium transition-colors',
                mobileView === id ? 'bg-elevated text-fg' : 'text-fg-muted hover:text-fg',
              )}
            >
              <Icon className={cn('h-4 w-4', mobileView === id && 'text-primary')} aria-hidden />
              {label}
            </button>
          ))}
        </nav>
        {/* Problem and workspace stay mounted so documents and the whiteboard keep syncing in the background. */}
        <div className="flex min-h-0 flex-1 flex-col gap-3 p-3">
          {mobileView !== 'call' && (
            // Faces stay in view while you work: a strip of small tiles above the content.
            <div className="h-[92px] shrink-0">
              <VideoStage variant="strip" people={people} selfId={user.id} inviteLink={inviteLink} />
            </div>
          )}
          <div className={cn('min-h-0 flex-1', mobileView !== 'problem' && 'hidden')}>{problem}</div>
          <div className={cn('min-h-0 flex-1', mobileView !== 'workspace' && 'hidden')}>{workspace}</div>
          {mobileView === 'call' && (
            <div className="min-h-0 flex-1">
              <VideoStage variant="grid" people={people} selfId={user.id} inviteLink={inviteLink} />
            </div>
          )}
        </div>
      </>
    )
  }

  return (
    <CallProvider roomId={code} devices={devices} className="flex h-dvh flex-col bg-bg [--room-bar-height:4.25rem]">
      <RoomHeader
        code={code}
        title={room.title}
        status={realtime.status}
        endsAt={room.endsAt}
        canExtend={me.host && !room.extended}
        onExtend={() => roomApi.extend(code).catch((error) => toast.error("Couldn't extend", { description: getErrorMessage(error) }))}
        onReconnect={realtime.reconnect}
      />

      {realtime.status === 'failed' && (
        <Alert tone="danger" className="mx-3 mt-3" title="Real-time connection lost">
          {realtime.failureReason?.includes('not-a-member') || realtime.failureReason?.includes('room-closed')
            ? "You're no longer in this interview."
            : 'Code runs, chat and participant updates are paused. Try reconnecting.'}
        </Alert>
      )}

      {body}

      {/* Control bar: its own row, so call controls never cover faces, code or the whiteboard. */}
      <footer
        className="flex h-[var(--room-bar-height)] shrink-0 items-center justify-between gap-2 px-3 sm:px-4 lg:grid lg:grid-cols-[1fr_auto_1fr]"
        aria-label="Call controls"
      >
        {isDesktop && (
          <div className="flex min-w-0 items-center gap-1">
            <PanelToggle icon={PanelLeft} label="Problem" pressed={problemOpen} onClick={() => togglePanel(problemPanel, problemOpen)} />
            <PanelToggle icon={PanelRight} label="Video" pressed={callOpen} onClick={() => togglePanel(callPanel, callOpen)} />
          </div>
        )}

        <div className="flex items-center gap-2">
          <CallControls />
          <Button
            variant="destructive"
            className="h-10 rounded-full px-3.5 sm:px-4"
            onClick={onLeaveClick}
            loading={leave.isPending}
            leftIcon={<PhoneOff className="h-4 w-4" />}
            aria-label="Leave the interview"
          >
            <span className="hidden sm:inline">Leave</span>
          </Button>
        </div>

        <div className="flex min-w-0 items-center justify-end gap-1.5 sm:gap-2">
          <PopupToggle icon={Users} label="People" count={present} alert={lobby.waiting.length || undefined} pressed={popup === 'people'} onClick={() => togglePopup('people')} />
          <PopupToggle icon={MessageSquare} label="Chat" alert={chat.unread || undefined} pressed={popup === 'chat'} onClick={() => togglePopup('chat')} />
          {me.staff && isDesktop && (
            <Button variant="danger" className="ml-1 h-10 rounded-full" onClick={() => setEndDialog(true)} title="End and save the interview for everyone">
              End interview
            </Button>
          )}
        </div>
      </footer>

      <RoomPopover
        open={popup === 'people'}
        onClose={() => setPopup(null)}
        rightOffset={popoverRight}
        title="People"
        meta={room.maxParticipants > 0 ? `${present} of ${room.maxParticipants}` : present}
      >
        <ParticipantsPanel realtime={realtime} lobby={lobby} currentUserId={user.id} />
      </RoomPopover>
      <RoomPopover open={popup === 'chat'} onClose={() => setPopup(null)} rightOffset={popoverRight} title="Chat">
        <ChatPanel chat={chat} currentUserId={user.id} />
      </RoomPopover>

      {/* Leaving as host or interviewer: keep the interview going or end it for everyone. */}
      <Modal
        open={leaveDialog}
        onClose={() => setLeaveDialog(false)}
        title="Leave the interview?"
        description={
          me.host
            ? 'You can leave and let the others continue — host controls pass to an interviewer — or end it for everyone.'
            : 'You can leave and let the others continue, or end it for everyone.'
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => leave.mutate()} loading={leave.isPending}>
              Leave
            </Button>
            <Button variant="destructive" onClick={() => endInterview.mutate()} loading={endInterview.isPending}>
              End for everyone
            </Button>
          </>
        }
      />
      <ConfirmDialog
        open={endDialog}
        title="End this interview for everyone?"
        description="The room closes for everyone. The code, notes, whiteboard, chat and participants are saved to the interview summary."
        confirmLabel="End interview"
        tone="danger"
        loading={endInterview.isPending}
        onConfirm={() => endInterview.mutate()}
        onCancel={() => setEndDialog(false)}
      />
    </CallProvider>
  )
}
