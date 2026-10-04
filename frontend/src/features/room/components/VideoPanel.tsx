import { useState } from 'react'
import { ControlBar, GridLayout, LiveKitRoom, ParticipantTile, RoomAudioRenderer, useTracks } from '@livekit/components-react'
import { Track } from 'livekit-client'
import { VideoOff } from 'lucide-react'
import '@livekit/components-styles'
import { Button } from '@/components/common/Button'
import { Spinner } from '@/components/common/Spinner'
import { config } from '@/constants/config'
import { useSfuToken } from '@/features/room/hooks/useRoom'
import { getErrorMessage } from '@/lib/apiError'

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-surface" aria-label="Video">
      {children}
    </section>
  )
}

function VideoMessage({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex min-h-44 flex-col items-center justify-center gap-1 p-5 text-center lg:aspect-video lg:min-h-0">
      <VideoOff className="mb-2 h-5 w-5 text-fg-muted" aria-hidden />
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs text-fg-muted">{description}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}

function VideoGrid() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  )
  return (
    <GridLayout tracks={tracks} style={{ height: '100%' }}>
      <ParticipantTile />
    </GridLayout>
  )
}

export function VideoPanel({ roomId }: { roomId: string }) {
  const enabled = Boolean(config.livekitUrl)
  const token = useSfuToken(roomId, enabled)
  const [connectionError, setConnectionError] = useState<Error | null>(null)
  const [attempt, setAttempt] = useState(0)

  if (!enabled) {
    return (
      <Frame>
        <VideoMessage title="Video isn't configured" description="Set VITE_LIVEKIT_URL to enable video calls." />
      </Frame>
    )
  }
  if (token.isPending) {
    return (
      <Frame>
        <div className="flex min-h-44 items-center justify-center text-fg-muted lg:aspect-video lg:min-h-0">
          <Spinner />
        </div>
      </Frame>
    )
  }
  if (token.isError || connectionError) {
    return (
      <Frame>
        <VideoMessage
          title="Video unavailable"
          description={token.isError ? getErrorMessage(token.error) : "Couldn't connect to the video server."}
          action={
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setConnectionError(null)
                setAttempt((n) => n + 1)
                if (token.isError) token.refetch()
              }}
            >
              Retry
            </Button>
          }
        />
      </Frame>
    )
  }

  return (
    <Frame>
      <LiveKitRoom
        key={attempt}
        serverUrl={config.livekitUrl}
        token={token.data}
        connect
        audio={false}
        video={false}
        onError={setConnectionError}
        data-lk-theme="default"
        className="flex flex-col"
        style={{ background: 'var(--color-surface)' }}
      >
        <div className="aspect-video">
          <VideoGrid />
        </div>
        <ControlBar variation="minimal" controls={{ leave: false, chat: false, settings: false }} className="border-t border-border" />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </Frame>
  )
}
