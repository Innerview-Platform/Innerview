import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useConnectionState, useMediaDeviceSelect, useTrackToggle } from '@livekit/components-react'
import { ConnectionState, Track } from 'livekit-client'
import { Mic, MicOff, MonitorUp, Settings2, Video, VideoOff } from 'lucide-react'
import { toast } from 'sonner'
import { Select } from '@/components/forms/controls'
import { ControlButton } from '@/features/room/components/call/ControlButton'
import { useCallState } from '@/features/room/components/call/CallProvider'

const canShareScreen = typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getDisplayMedia)

/** Microphone, camera, screen share and device settings for the room's call. */
export function CallControls() {
  const { status, error } = useCallState()
  if (status === 'off' || status === 'error') {
    const reason = status === 'off' ? "Video isn't configured" : (error ?? 'Video unavailable')
    return (
      <>
        <ControlButton label={reason} icon={MicOff} state="off" disabled />
        <ControlButton label={reason} icon={VideoOff} state="off" disabled />
      </>
    )
  }
  return <LiveControls />
}

function LiveControls() {
  const ready = useConnectionState() === ConnectionState.Connected
  const onDeviceError = (error: Error) => toast.error("Couldn't change the device", { description: error.message })
  const mic = useTrackToggle({ source: Track.Source.Microphone, onDeviceError })
  const camera = useTrackToggle({ source: Track.Source.Camera, onDeviceError })
  const screen = useTrackToggle({
    source: Track.Source.ScreenShare,
    // Cancelling the browser's picker isn't an error worth reporting.
    onDeviceError: (error) => error.name !== 'NotAllowedError' && onDeviceError(error),
  })

  return (
    <>
      <ControlButton
        label={mic.enabled ? 'Mute microphone' : 'Unmute microphone'}
        icon={mic.enabled ? Mic : MicOff}
        state={mic.enabled ? 'on' : 'off'}
        pressed={!mic.enabled}
        disabled={!ready || mic.pending}
        onClick={() => void mic.toggle()}
      />
      <ControlButton
        label={camera.enabled ? 'Turn camera off' : 'Turn camera on'}
        icon={camera.enabled ? Video : VideoOff}
        state={camera.enabled ? 'on' : 'off'}
        pressed={!camera.enabled}
        disabled={!ready || camera.pending}
        onClick={() => void camera.toggle()}
      />
      {canShareScreen && (
        <span className="hidden sm:contents">
          <ControlButton
            label={screen.enabled ? 'Stop presenting' : 'Present your screen'}
            icon={MonitorUp}
            state={screen.enabled ? 'active' : 'on'}
            pressed={screen.enabled}
            disabled={!ready || screen.pending}
            onClick={() => void screen.toggle()}
          />
        </span>
      )}
      <DeviceMenu disabled={!ready} />
    </>
  )
}

/** Small menu above the settings button to pick the microphone, camera and speaker. */
function DeviceMenu({ disabled }: { disabled: boolean }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={ref} className="relative hidden sm:block">
      <ControlButton label="Audio and video settings" icon={Settings2} pressed={open} disabled={disabled} onClick={() => setOpen((v) => !v)} />
      {open && (
        <div
          role="dialog"
          aria-label="Audio and video settings"
          className="absolute bottom-full left-1/2 z-40 mb-3 w-72 -translate-x-1/2 animate-[popover-in_160ms_var(--ease-out-soft)_both] space-y-3 rounded-xl border border-border bg-surface p-4 shadow-pop"
        >
          <DeviceSelect kind="audioinput" label="Microphone" />
          <DeviceSelect kind="videoinput" label="Camera" />
          <DeviceSelect kind="audiooutput" label="Speaker" />
        </div>
      )}
    </div>
  )
}

function DeviceSelect({ kind, label }: { kind: MediaDeviceKind; label: string }): ReactNode {
  const { devices, activeDeviceId, setActiveMediaDevice } = useMediaDeviceSelect({ kind })
  // Browsers without speaker selection (Safari, Firefox) report no outputs.
  if (devices.length === 0) return null
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-fg-secondary">{label}</span>
      <Select
        className="h-9 text-[13px]"
        value={activeDeviceId}
        onChange={(event) =>
          setActiveMediaDevice(event.target.value).catch((error: Error) => toast.error(`Couldn't switch ${label.toLowerCase()}`, { description: error.message }))
        }
      >
        {devices.map((device, index) => (
          <option key={device.deviceId} value={device.deviceId}>
            {device.label || `${label} ${index + 1}`}
          </option>
        ))}
      </Select>
    </label>
  )
}
