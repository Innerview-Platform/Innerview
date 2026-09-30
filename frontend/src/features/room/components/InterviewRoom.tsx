import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { FileText, LayoutPanelLeft, MessageSquare, PanelLeft, PanelRight, Users, Video, type LucideIcon } from 'lucide-react'
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
import { ChatPanel } from '@/features/room/components/ChatPanel'
import { layoutStorage } from '@/features/room/components/layout/layoutStorage'
import { ResizeHandle } from '@/features/room/components/layout/ResizeHandle'
import { ParticipantsPanel } from '@/features/room/components/ParticipantsPanel'
import { RoomHeader } from '@/features/room/components/RoomHeader'
import type { DevicePreferences } from '@/features/room/components/VideoPanel'
import { WorkspaceTabs, type WorkspaceTab } from '@/features/room/components/WorkspaceTabs'
import { useRoomRealtime } from '@/features/room/hooks/useRoomRealtime'
import type { JoinResult, RoomUiConfig } from '@/features/room/types'
import { ROOM_ROLE_LABELS } from '@/features/room/utils/labels'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { getErrorMessage } from '@/lib/apiError'
import { cn } from '@/lib/utils'
import { paths } from '@/routes/paths'

// Heavy dependencies (CodeMirror, Excalidraw, LiveKit) load only inside the room.
const ProblemPanel = lazy(() => import('@/features/room/components/ProblemPanel').then((m) => ({ default: m.ProblemPanel })))
const CodeEditorPanel = lazy(() => import('@/features/room/components/CodeEditorPanel').then((m) => ({ default: m.CodeEditorPanel })))
const SharedCanvasPanel = lazy(() => import('@/features/room/components/SharedCanvasPanel').then((m) => ({ default: m.SharedCanvasPanel })))
const VideoPanel = lazy(() => import('@/features/room/components/VideoPanel').then((m) => ({ default: m.VideoPanel })))

/** System-design rooms open on the whiteboard; everything else opens on the code editor. */
const defaultTab = (uiConfig: RoomUiConfig): WorkspaceTab => (uiConfig.showSystemCanvas && !uiConfig.showSharedEditor ? 'whiteboard' : 'code')

type MobileView = 'problem' | 'workspace' | 'call'
type SideTab = 'people' | 'chat'

const MOBILE_VIEWS: { id: MobileView; label: string; icon: LucideIcon }[] = [
  { id: 'problem', label: 'Problem', icon: FileText },
  { id: 'workspace', label: 'Workspace', icon: LayoutPanelLeft },
  { id: 'call', label: 'Call', icon: Video },
]

function PanelFallback({ className }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center rounded-xl border border-border bg-surface text-fg-muted ${className ?? ''}`}>
      <Spinner />
    </div>
  )
}

function PanelToggle({ icon: Icon, label, pressed, onClick }: { icon: LucideIcon; label: string; pressed: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      title={`${pressed ? 'Hide' : 'Show'} ${label.toLowerCase()} panel`}
      className={cn(
        'flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-medium transition-colors',
        pressed ? 'bg-elevated text-fg' : 'text-fg-muted hover:bg-elevated hover:text-fg',
      )}
    >
      <Icon className="h-4 w-4" aria-hidden />
      {label}
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
  const user = { id: authUser.id, name: myName }

  // ── layout ───────────────────────────────────────────────────────────────
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [tab, setTab] = useState<WorkspaceTab | null>(null)
  const activeTab = tab ?? defaultTab(room.uiConfig)
  const [whiteboardMounted, setWhiteboardMounted] = useState(false)
  if (activeTab === 'whiteboard' && !whiteboardMounted) setWhiteboardMounted(true)
  const [mobileView, setMobileView] = useState<MobileView>('workspace')
  const [sideTab, setSideTab] = useState<SideTab>('people')
  const [unread, setUnread] = useState(0)

  const problemPanel = usePanelRef()
  const callPanel = usePanelRef()
  const roomLayout = useDefaultLayout({ id: 'innerview-room-layout', storage: layoutStorage })
  const [problemOpen, setProblemOpen] = useState(() => (roomLayout.defaultLayout?.problem ?? 1) > 0)
  const [callOpen, setCallOpen] = useState(() => (roomLayout.defaultLayout?.call ?? 1) > 0)

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

  const onLeaveClick = () => (me.host ? setLeaveDialog(true) : leave.mutate())

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
      <Modal open onClose={() => exit(paths.home)} title="You joined from another tab" description="This interview is open in another tab or device, so this one was disconnected." dismissible={false}
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

  // ── panels ───────────────────────────────────────────────────────────────
  const tabs = <WorkspaceTabs value={activeTab} onChange={setTab} />

  const problem = (
    <Suspense fallback={<PanelFallback className="h-full" />}>
      <ProblemPanel realtime={realtime} user={user} />
    </Suspense>
  )

  const workspace = (
    <div className="h-full min-h-0">
      <div className={cn('h-full', activeTab !== 'code' && 'hidden')}>
        <Suspense fallback={<PanelFallback className="h-full" />}>
          <CodeEditorPanel realtime={realtime} user={user} header={tabs} />
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

  const call = (
    <aside className="flex h-full min-h-0 flex-col gap-3" aria-label="Call, people and chat">
      <Suspense fallback={<PanelFallback className="aspect-video" />}>
        <VideoPanel roomId={code} devices={devices} />
      </Suspense>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-surface">
        <div role="tablist" className="flex shrink-0 gap-1 border-b border-border p-1.5">
          {(
            [
              { id: 'people', label: 'People', icon: Users, badge: 0 },
              { id: 'chat', label: 'Chat', icon: MessageSquare, badge: unread },
            ] as const
          ).map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={sideTab === id}
              onClick={() => {
                setSideTab(id)
                if (id === 'chat') setUnread(0)
              }}
              className={cn(
                'flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md text-[13px] font-medium',
                sideTab === id ? 'bg-elevated text-fg' : 'text-fg-muted hover:text-fg',
              )}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden />
              {label}
              {badge > 0 && <span className="rounded-full bg-primary px-1.5 text-[10px] text-white">{badge}</span>}
            </button>
          ))}
        </div>
        <div className={cn('flex min-h-0 flex-1 flex-col', sideTab !== 'people' && 'hidden')}>
          <ParticipantsPanel realtime={realtime} currentUserId={user.id} />
        </div>
        <div className={cn('flex min-h-0 flex-1 flex-col', sideTab !== 'chat' && 'hidden')}>
          <ChatPanel realtime={realtime} currentUserId={user.id} onUnread={() => sideTab !== 'chat' && setUnread((n) => n + 1)} />
        </div>
      </div>
    </aside>
  )

  const togglePanel = (panel: typeof problemPanel, open: boolean) => (open ? panel.current?.collapse() : panel.current?.expand())

  return (
    <div className="flex h-dvh flex-col bg-bg">
      <RoomHeader
        code={code}
        title={room.title}
        status={realtime.status}
        endsAt={room.endsAt}
        canExtend={me.host && !room.extended}
        onExtend={() => roomApi.extend(code).catch((error) => toast.error("Couldn't extend", { description: getErrorMessage(error) }))}
        onReconnect={realtime.reconnect}
        onLeave={onLeaveClick}
        leaving={leave.isPending}
        onEnd={me.staff ? () => setEndDialog(true) : undefined}
      >
        {isDesktop && (
          <div className="mr-1 flex items-center gap-1 border-r border-border pr-3">
            <PanelToggle icon={PanelLeft} label="Problem" pressed={problemOpen} onClick={() => togglePanel(problemPanel, problemOpen)} />
            <PanelToggle icon={PanelRight} label="Call" pressed={callOpen} onClick={() => togglePanel(callPanel, callOpen)} />
          </div>
        )}
      </RoomHeader>

      {/* Host leaving: keep the interview going (host rights pass on) or end it for everyone. */}
      <Modal
        open={leaveDialog}
        onClose={() => setLeaveDialog(false)}
        title="Leave the interview?"
        description="You can leave and let the others continue — host controls pass to an interviewer — or end it for everyone."
        footer={
          <>
            <Button variant="secondary" onClick={() => leave.mutate()} loading={leave.isPending}>
              Leave
            </Button>
            <Button className="bg-danger hover:bg-danger/85" onClick={() => endInterview.mutate()} loading={endInterview.isPending}>
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

      {realtime.status === 'failed' && (
        <Alert tone="danger" className="mx-3 mt-3" title="Real-time connection lost">
          {realtime.failureReason?.includes('not-a-member') || realtime.failureReason?.includes('room-closed')
            ? "You're no longer in this interview."
            : 'Code runs, chat and participant updates are paused. Try reconnecting.'}
        </Alert>
      )}

      {isDesktop ? (
        <Group orientation="horizontal" id="innerview-room-layout" className="min-h-0 flex-1 p-3" defaultLayout={roomLayout.defaultLayout} onLayoutChanged={roomLayout.onLayoutChanged}>
          <Panel id="problem" panelRef={problemPanel} collapsible collapsedSize="0%" defaultSize="20%" minSize="240px" maxSize="40%" onResize={(size) => setProblemOpen(size.asPercentage > 0)}>
            {problem}
          </Panel>
          <ResizeHandle />
          <Panel id="workspace" minSize="40%">
            {workspace}
          </Panel>
          <ResizeHandle />
          <Panel id="call" panelRef={callPanel} collapsible collapsedSize="0%" defaultSize="24%" minSize="280px" maxSize="40%" onResize={(size) => setCallOpen(size.asPercentage > 0)}>
            {call}
          </Panel>
        </Group>
      ) : (
        <>
          <nav className="flex shrink-0 gap-1 border-b border-border px-3 py-2" aria-label="Room views">
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
                <Icon className="h-4 w-4" aria-hidden />
                {label}
              </button>
            ))}
          </nav>
          {/* All views stay mounted so the call, documents and whiteboard keep running in the background. */}
          <div className="min-h-0 flex-1 p-3">
            <div className={cn('h-full', mobileView !== 'problem' && 'hidden')}>{problem}</div>
            <div className={cn('h-full', mobileView !== 'workspace' && 'hidden')}>{workspace}</div>
            <div className={cn('h-full', mobileView !== 'call' && 'hidden')}>{call}</div>
          </div>
        </>
      )}
    </div>
  )
}
