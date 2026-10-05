import type { ReactNode } from 'react'
import {
  isTrackReference,
  useAudioPlayback,
  useConnectionState,
  useIsSpeaking,
  useTrackMutedIndicator,
  useTracks,
  VideoTrack,
  type TrackReferenceOrPlaceholder,
} from '@livekit/components-react'
import { ConnectionState, Track } from 'livekit-client'
import { MicOff, MonitorUp, RotateCw, Volume2, VideoOff } from 'lucide-react'
import { Avatar } from '@/components/common/Avatar'
import { Button } from '@/components/common/Button'
import { CopyButton } from '@/components/common/CopyButton'
import { Spinner } from '@/components/common/Spinner'
import { useCallState } from '@/features/room/components/call/CallProvider'
import type { RoomParticipant } from '@/features/room/types'
import { ROOM_ROLE_LABELS } from '@/features/room/utils/labels'
import { cn } from '@/lib/utils'

/**
 * `column`: tiles stacked in the side column (desktop). `strip`: a row of small tiles above the
 * workspace (tablet/phone). `grid`: the phone's dedicated call view.
 */
type StageVariant = 'column' | 'strip' | 'grid'

interface VideoStageProps {
  variant: StageVariant
  /** Room participants by user id (LiveKit identity = user id): names, avatars, roles. */
  people: Map<string, RoomParticipant>
  /** Your user id: names your own tile even before LiveKit has assigned your identity. */
  selfId: string
  /** Invite link, offered while you're alone in the call. */
  inviteLink: string
}

/** Where the faces go. Names and mic state sit under each tile, never on top of the video. */
export function VideoStage(props: VideoStageProps) {
  const { status, error, retry } = useCallState()
  if (status === 'off') return <StageMessage variant={props.variant} icon={<VideoOff className="h-5 w-5" />} title="Video isn't configured" text="Set VITE_LIVEKIT_URL to enable calls." />
  if (status === 'error') {
    return (
      <StageMessage
        variant={props.variant}
        icon={<VideoOff className="h-5 w-5" />}
        title="Video unavailable"
        text={error ?? undefined}
        action={
          <Button size="sm" variant="secondary" onClick={retry} leftIcon={<RotateCw className="h-3.5 w-3.5" />}>
            Retry
          </Button>
        }
      />
    )
  }
  return <LiveStage {...props} />
}

function LiveStage({ variant, people, selfId, inviteLink }: VideoStageProps) {
  const connection = useConnectionState()
  const { canPlayAudio, startAudio } = useAudioPlayback()
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  )

  if (connection !== ConnectionState.Connected && tracks.length === 0) {
    return (
      <StageMessage
        variant={variant}
        icon={<Spinner size="sm" />}
        title={connection === ConnectionState.Reconnecting ? 'Reconnecting video…' : 'Connecting video…'}
      />
    )
  }

  const screens = tracks.filter((t) => t.source === Track.Source.ScreenShare)
  // The other people first: in a 1:1 interview, the person you're talking to is what matters.
  const cameras = tracks
    .filter((t) => t.source === Track.Source.Camera)
    .sort((a, b) => Number(a.participant.isLocal) - Number(b.participant.isLocal))
  // In the room but not (yet) on the call: still show them, so "waiting for your partner" is never wrong.
  const onCall = new Set(cameras.map((t) => (t.participant.isLocal ? selfId : t.participant.identity)))
  const offCall = [...people.values()].filter((p) => p.status !== 'LEFT' && !onCall.has(p.userId))
  const alone = cameras.length + offCall.length <= 1
  const personOf = (trackRef: TrackReferenceOrPlaceholder) => people.get(trackRef.participant.isLocal ? selfId : trackRef.participant.identity)

  return (
    <div
      className={cn(
        'min-h-0',
        variant === 'column' && 'flex h-full flex-col gap-3 overflow-y-auto',
        variant === 'strip' && 'flex h-full gap-2 overflow-x-auto',
        variant === 'grid' && 'grid h-full auto-rows-fr gap-3 overflow-y-auto sm:grid-cols-2',
      )}
      aria-label="Video call"
    >
      {!canPlayAudio && (
        <button
          type="button"
          onClick={() => void startAudio()}
          className={cn(
            'flex shrink-0 items-center justify-center gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs font-medium text-warning',
            variant === 'grid' && 'sm:col-span-2',
          )}
        >
          <Volume2 className="h-4 w-4" aria-hidden /> Your browser paused the call audio — click to hear others
        </button>
      )}
      {screens.map((trackRef) => (
        <Tile key={`${trackRef.participant.identity}-screen`} trackRef={trackRef} person={personOf(trackRef)} variant={variant} screen />
      ))}
      {cameras.map((trackRef) => (
        <Tile key={trackRef.participant.isLocal ? 'local' : trackRef.participant.identity} trackRef={trackRef} person={personOf(trackRef)} variant={variant} />
      ))}
      {offCall.map((person) => (
        <OffCallTile key={person.userId} person={person} variant={variant} />
      ))}
      {alone && variant !== 'strip' && (
        <div className={cn('flex shrink-0 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border px-4 py-6 text-center', variant === 'column' && 'flex-1')}>
          <p className="text-sm font-medium">Waiting for your partner</p>
          <p className="max-w-56 text-xs text-fg-muted">They'll appear here when they join. Share the link if they don't have it yet.</p>
          <CopyButton value={inviteLink} label="Copy invite link" />
        </div>
      )}
    </div>
  )
}

function Tile({ trackRef, person, variant, screen = false }: { trackRef: TrackReferenceOrPlaceholder; person?: RoomParticipant; variant: StageVariant; screen?: boolean }) {
  const { participant } = trackRef
  const speaking = useIsSpeaking(participant)
  const { isMuted: micMuted } = useTrackMutedIndicator({ participant, source: Track.Source.Microphone })
  const showVideo = isTrackReference(trackRef) && !trackRef.publication.isMuted
  const name = person?.name ?? (participant.name || 'Guest')
  const label = participant.isLocal ? `${name} (you)` : name
  const compact = variant === 'strip'

  return (
    <figure
      className={cn(
        'flex min-w-0 shrink-0 flex-col gap-1.5',
        variant === 'column' && (screen ? '' : 'min-h-[150px] flex-1'),
        variant === 'strip' && 'h-full',
        variant === 'grid' && 'min-h-[180px]',
      )}
    >
      <div
        className={cn(
          'relative min-h-0 overflow-hidden rounded-xl bg-stage ring-2 ring-offset-0 transition-shadow duration-200',
          speaking && !screen ? 'ring-primary' : 'ring-transparent',
          variant === 'column' && (screen ? 'aspect-video' : 'max-h-[420px] flex-1'),
          variant === 'strip' && 'aspect-video h-full rounded-lg',
          variant === 'grid' && 'flex-1',
        )}
      >
        {showVideo ? (
          <VideoTrack
            trackRef={trackRef}
            className={cn('h-full w-full', screen ? 'object-contain' : 'object-cover', participant.isLocal && !screen && '-scale-x-100')}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Avatar label={name} src={person?.avatarThumbUrl} size={compact ? 32 : 64} />
          </div>
        )}
      </div>
      <figcaption className={cn('flex min-w-0 items-center gap-1.5 px-0.5', compact ? 'text-[11px]' : 'text-xs')}>
        {screen ? (
          <MonitorUp className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
        ) : (
          micMuted && <MicOff className="h-3.5 w-3.5 shrink-0 text-danger" aria-label="Microphone off" />
        )}
        <span className="truncate font-medium text-fg">{screen ? `${name} is presenting` : label}</span>
        {!screen && !compact && person && <span className="shrink-0 text-fg-muted">· {ROOM_ROLE_LABELS[person.role]}</span>}
      </figcaption>
    </figure>
  )
}

/** Someone in the room who isn't connected to the video call. */
function OffCallTile({ person, variant }: { person: RoomParticipant; variant: StageVariant }) {
  const compact = variant === 'strip'
  return (
    <figure
      className={cn(
        'flex min-w-0 shrink-0 flex-col gap-1.5',
        variant === 'column' && 'min-h-[150px] flex-1',
        variant === 'strip' && 'h-full',
        variant === 'grid' && 'min-h-[180px]',
      )}
    >
      <div
        className={cn(
          'flex min-h-0 items-center justify-center rounded-xl border border-dashed border-border',
          variant === 'column' && 'max-h-[420px] flex-1',
          variant === 'strip' && 'aspect-video h-full rounded-lg',
          variant === 'grid' && 'flex-1',
        )}
      >
        <Avatar label={person.name} src={person.avatarThumbUrl} size={compact ? 32 : 56} className="opacity-70" />
      </div>
      <figcaption className={cn('flex min-w-0 items-center gap-1.5 px-0.5 text-fg-muted', compact ? 'text-[11px]' : 'text-xs')}>
        <VideoOff className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span className="truncate">
          <span className="font-medium text-fg">{person.name}</span> · not on video
        </span>
      </figcaption>
    </figure>
  )
}

function StageMessage({ variant, icon, title, text, action }: { variant: StageVariant; icon: ReactNode; title: string; text?: string; action?: ReactNode }) {
  if (variant === 'strip') {
    return (
      <div className="flex h-full items-center gap-3 rounded-lg border border-dashed border-border px-3 text-xs text-fg-muted">
        <span className="shrink-0">{icon}</span>
        <span className="min-w-0 truncate">
          <span className="font-medium text-fg">{title}</span>
          {text ? ` — ${text}` : ''}
        </span>
        {action}
      </div>
    )
  }
  return (
    <div className="flex h-full min-h-44 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border px-5 text-center">
      <span className="mb-1 text-fg-muted">{icon}</span>
      <p className="text-sm font-medium">{title}</p>
      {text && <p className="text-xs text-fg-muted">{text}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
