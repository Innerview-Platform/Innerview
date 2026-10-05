import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { LiveKitRoom, RoomAudioRenderer } from '@livekit/components-react'
import { toast } from 'sonner'
import { config } from '@/constants/config'
import { useSfuToken } from '@/features/room/hooks/useRoom'
import { getErrorMessage } from '@/lib/apiError'

/** Camera/microphone choices from the pre-join screen. */
export interface DevicePreferences {
  audio: boolean
  video: boolean
  audioDeviceId?: string
  videoDeviceId?: string
}

/**
 * `off`: video isn't configured (no VITE_LIVEKIT_URL) — no LiveKit context exists below.
 * `pending` / `live`: LiveKit context exists; `error`: the token or the connection failed.
 */
type CallStatus = 'off' | 'pending' | 'live' | 'error'

interface CallState {
  status: CallStatus
  error: string | null
  retry: () => void
}

const CallContext = createContext<CallState>({ status: 'off', error: null, retry: () => {} })

export const useCallState = () => useContext(CallContext)

interface CallProviderProps {
  roomId: string
  devices: DevicePreferences
  className?: string
  children: ReactNode
}

/**
 * The room's video call (LiveKit). It wraps the whole interview room so the video tiles and the
 * control bar share one connection, and a failed call never takes the editor or whiteboard down.
 */
export function CallProvider({ roomId, devices, className, children }: CallProviderProps) {
  const enabled = Boolean(config.livekitUrl)
  const token = useSfuToken(roomId, enabled)
  const [connectionError, setConnectionError] = useState<Error | null>(null)
  const [connect, setConnect] = useState(true)

  // Retrying flips `connect` off and on so LiveKit starts a fresh connection.
  useEffect(() => {
    if (connect) return
    const timer = setTimeout(() => setConnect(true), 0)
    return () => clearTimeout(timer)
  }, [connect])

  const { isError: tokenFailed, refetch } = token
  const retry = useCallback(() => {
    setConnectionError(null)
    if (tokenFailed) void refetch()
    setConnect(false)
  }, [tokenFailed, refetch])

  if (!enabled) {
    return (
      <CallContext.Provider value={{ status: 'off', error: null, retry }}>
        <div className={className}>{children}</div>
      </CallContext.Provider>
    )
  }

  const error = token.isError ? getErrorMessage(token.error) : connectionError ? "Couldn't connect to the video server." : null
  const status: CallStatus = error ? 'error' : token.data ? 'live' : 'pending'

  return (
    <CallContext.Provider value={{ status, error, retry }}>
      <LiveKitRoom
        serverUrl={config.livekitUrl}
        token={token.data}
        connect={connect && !connectionError && Boolean(token.data)}
        audio={devices.audio ? (devices.audioDeviceId ? { deviceId: devices.audioDeviceId } : true) : false}
        video={devices.video ? (devices.videoDeviceId ? { deviceId: devices.videoDeviceId } : true) : false}
        onError={setConnectionError}
        // A blocked or missing camera/microphone isn't a connection problem: stay in the call without it.
        onMediaDeviceFailure={(failure) =>
          toast.warning('Camera or microphone unavailable', { description: failure ? `You joined without it (${failure}).` : undefined })
        }
        className={className}
      >
        {children}
        <RoomAudioRenderer />
      </LiveKitRoom>
    </CallContext.Provider>
  )
}
