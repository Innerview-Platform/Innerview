import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { PageLoader } from '@/components/feedback/states'
import { roomApi } from '@/features/room/api/roomApi'
import { InterviewRoom } from '@/features/room/components/InterviewRoom'
import { PreJoinScreen } from '@/features/room/components/PreJoinScreen'
import { RoomErrorScreen } from '@/features/room/components/RoomErrorScreen'
import type { DevicePreferences } from '@/features/room/components/VideoPanel'
import { roomKeys } from '@/features/room/hooks/useRoom'
import type { AccessStatus, JoinResult } from '@/features/room/types'
import { canonicalCode, formatCode } from '@/features/room/utils/roomCode'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { getErrorMessage } from '@/lib/apiError'
import { paths } from '@/routes/paths'

interface Session {
  joined: JoinResult
  devices: DevicePreferences
  takeover: boolean
}

/**
 * The interview room at /abc-defg-hij: pre-join (device check, join / ask to join), the lobby wait,
 * the call itself and the "ended" state all live at the same URL, like Google Meet.
 */
export default function RoomPage() {
  const { code: rawCode = '' } = useParams()
  const code = canonicalCode(rawCode) ?? rawCode
  const navigate = useNavigate()
  const [session, setSession] = useState<Session | null>(null)
  useDocumentTitle(session?.joined.room.title ?? formatCode(code))

  // Normalize the URL to the canonical display form (e.g. typed in capitals or without dashes).
  useEffect(() => {
    if (rawCode !== formatCode(code)) navigate(paths.room(code), { replace: true })
  }, [rawCode, code, navigate])

  const access = useQuery({
    queryKey: roomKeys.access(code),
    queryFn: () => roomApi.access(code),
    enabled: !session,
    retry: false,
    // Waiting in the lobby, or for a scheduled start: keep checking.
    refetchInterval: (query) => {
      const status = query.state.data?.access
      return status === 'PENDING' ? 2_000 : status === 'NOT_STARTED' || status === 'FULL' ? 15_000 : false
    },
  })

  const lastDevices = useRef<DevicePreferences>({ audio: true, video: true })
  const join = useMutation({
    mutationFn: (options: { devices: DevicePreferences; takeover: boolean }) => roomApi.join(code).then((joined) => ({ joined, ...options })),
    onSuccess: (next) => setSession(next),
    onError: (error) => {
      toast.error("Couldn't join", { description: getErrorMessage(error) })
      void access.refetch()
    },
  })
  const knock = useMutation({
    mutationFn: () => roomApi.knock(code),
    onSettled: () => access.refetch(),
    onError: (error) => toast.error("Couldn't ask to join", { description: getErrorMessage(error) }),
  })
  const cancelKnock = useMutation({ mutationFn: () => roomApi.cancelKnock(code), onSettled: () => access.refetch() })

  // Lobby outcome: admitted → join automatically; declined → tell them.
  const previous = useRef<AccessStatus | null>(null)
  useEffect(() => {
    const current = access.data?.access ?? null
    if (previous.current === 'PENDING' && access.data) {
      if (access.data.canJoin && !join.isPending) {
        toast.success('You were let in')
        join.mutate({ devices: lastDevices.current, takeover: false })
      } else if (current === 'MUST_ASK' || current === 'DENIED') {
        toast.error('Your request to join was declined')
      }
    }
    previous.current = current
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [access.data])

  if (session) {
    return (
      <InterviewRoom
        key={session.joined.ticket}
        joined={session.joined}
        devices={session.devices}
        takeover={session.takeover}
        onRejoin={() => join.mutate({ devices: session.devices, takeover: true })}
      />
    )
  }

  if (access.isPending) return <PageLoader label="Checking the room…" />
  if (!access.data) return <RoomErrorScreen error={access.error} onRetry={() => access.refetch()} retrying={access.isFetching} />

  return (
    <PreJoinScreen
      access={access.data}
      busy={join.isPending || knock.isPending}
      onJoin={(devices) => {
        lastDevices.current = devices
        join.mutate({ devices, takeover: access.data.alreadyConnected })
      }}
      onKnock={() => knock.mutate()}
      onCancelKnock={() => cancelKnock.mutate()}
    />
  )
}
