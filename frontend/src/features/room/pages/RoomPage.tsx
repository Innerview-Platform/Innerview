import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Code2, FileText, Layers, MessagesSquare } from 'lucide-react'
import { useAppSelector } from '@/app/hooks'
import { Button } from '@/components/common/Button'
import { Spinner } from '@/components/common/Spinner'
import { Alert } from '@/components/feedback/Alert'
import { PageLoader } from '@/components/feedback/states'
import { selectAccessToken, selectCurrentUser } from '@/features/auth/slices/authSlice'
import { roomApi } from '@/features/room/api/roomApi'
import { ParticipantsPanel } from '@/features/room/components/ParticipantsPanel'
import { RoomErrorScreen } from '@/features/room/components/RoomErrorScreen'
import { RoomHeader } from '@/features/room/components/RoomHeader'
import { RoomNotice } from '@/features/room/components/RoomNotice'
import { useRoomState } from '@/features/room/hooks/useRoom'
import { useRoomRealtime } from '@/features/room/hooks/useRoomRealtime'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { paths } from '@/routes/paths'

// Heavy dependencies (CodeMirror, LiveKit) load only inside the room.
const CodeEditorPanel = lazy(() => import('@/features/room/components/CodeEditorPanel').then((m) => ({ default: m.CodeEditorPanel })))
const VideoPanel = lazy(() => import('@/features/room/components/VideoPanel').then((m) => ({ default: m.VideoPanel })))

function PanelFallback({ className }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center rounded-xl border border-border bg-surface text-fg-muted ${className ?? ''}`}>
      <Spinner />
    </div>
  )
}

export default function RoomPage() {
  const { roomId = '' } = useParams()
  useDocumentTitle(`Room ${roomId}`)
  const navigate = useNavigate()
  const user = useAppSelector(selectCurrentUser)!
  const accessToken = useAppSelector(selectAccessToken)

  const [hasLeft, setHasLeft] = useState(false)
  const room = useRoomState(roomId, !hasLeft)
  const joined = Boolean(room.data)
  const realtime = useRoomRealtime({ roomId, currentUserId: user.id, accessToken, enabled: joined && !hasLeft })

  const leftRef = useRef(false)
  const joinedRef = useRef(false)
  const tokenRef = useRef(accessToken)
  useEffect(() => {
    joinedRef.current = joined
    tokenRef.current = accessToken
  })

  // Closing the tab or reloading: the backend never broadcasts socket disconnects, so leave explicitly.
  useEffect(() => {
    if (!joined) return
    const onPageHide = () => {
      if (!leftRef.current && tokenRef.current) roomApi.leaveOnUnload(roomId, tokenRef.current)
    }
    window.addEventListener('pagehide', onPageHide)
    return () => window.removeEventListener('pagehide', onPageHide)
  }, [joined, roomId])

  // Navigating away inside the app. Deferred so React StrictMode's simulated unmount doesn't leave the room.
  const pendingLeave = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => {
    clearTimeout(pendingLeave.current)
    return () => {
      pendingLeave.current = setTimeout(() => {
        if (leftRef.current || !joinedRef.current) return
        leftRef.current = true
        roomApi.leave(roomId).catch(() => {})
      }, 0)
    }
  }, [roomId])

  const leave = useMutation({
    mutationFn: () => roomApi.leave(roomId),
    // Leaving is best effort: the backend answers 500 if the socket session was never registered,
    // even though the participant has been removed.
    onSettled: () => navigate(paths.dashboard, { replace: true }),
  })

  const onLeave = () => {
    leftRef.current = true
    setHasLeft(true)
    leave.mutate()
  }

  if (room.isPending) return <PageLoader label="Joining room…" />
  if (!room.data) return <RoomErrorScreen error={room.error} onRetry={() => room.refetch()} retrying={room.isFetching} />

  const { uiConfig, participants } = room.data
  const participantList = Object.values(participants)
  const me = participants[user.id]
  const openEditor = () => realtime.send('JOIN_FEATURE', { element: 'SHARED_EDITOR' })

  return (
    <div className="flex h-dvh flex-col bg-bg">
      <RoomHeader roomId={roomId} status={realtime.status} onReconnect={realtime.reconnect} onLeave={onLeave} leaving={leave.isPending} />

      {realtime.status === 'failed' && (
        <Alert tone="danger" className="mx-3 mt-3" title="Real-time connection lost">
          {realtime.failureReason === 'unauthorized'
            ? 'Your session is no longer valid. Sign in again to rejoin the room.'
            : 'Code sync and participant updates are paused. Try reconnecting.'}
        </Alert>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto lg:overflow-hidden">
        <div className="grid gap-3 p-3 lg:h-full lg:grid-cols-[minmax(0,1fr)_340px]">
          <main className="flex min-h-0 flex-col gap-3">
            {uiConfig.showProblemStatement && (
              <RoomNotice
                icon={FileText}
                title="Problem statement"
                description="No problem is attached to this room. The interviewer can share it verbally or paste it into the editor."
              />
            )}

            {uiConfig.showSharedEditor ? (
              <div className="min-h-[420px] flex-1 lg:min-h-0">
                <Suspense fallback={<PanelFallback className="h-full min-h-[420px]" />}>
                  <CodeEditorPanel realtime={realtime} />
                </Suspense>
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 py-16 text-center">
                <MessagesSquare className="h-6 w-6 text-fg-muted" aria-hidden />
                <h2 className="mt-3 font-semibold">Conversation-focused session</h2>
                <p className="mt-1 max-w-sm text-sm text-fg-muted">This interview type doesn&apos;t include a code editor by default.</p>
                <Button variant="secondary" className="mt-5" onClick={openEditor} disabled={realtime.status !== 'connected'} leftIcon={<Code2 className="h-4 w-4" />}>
                  Open shared editor
                </Button>
              </div>
            )}

            {uiConfig.showSystemCanvas && (
              <RoomNotice icon={Layers} title="System design canvas" description="The collaborative canvas isn't available on the server yet." />
            )}
          </main>

          <aside className="flex min-h-0 flex-col gap-3 lg:overflow-y-auto" aria-label="Call and participants">
            <Suspense fallback={<PanelFallback className="aspect-video" />}>
              <VideoPanel roomId={roomId} />
            </Suspense>
            <ParticipantsPanel
              participants={participantList}
              currentUserId={user.id}
              currentUserEmail={user.email}
              canChangeRoles={me?.role === 'INTERVIEWER'}
              onChangeRole={realtime.changeRole}
            />
          </aside>
        </div>
      </div>
    </div>
  )
}
