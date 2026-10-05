import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Ban, CalendarClock, DoorOpen, Hourglass, Mic, MicOff, Users, Video, VideoOff } from 'lucide-react'
import { Button, buttonClasses } from '@/components/common/Button'
import { LogoMark } from '@/components/common/Logo'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { Select } from '@/components/forms/controls'
import { INTERVIEW_TYPE_LABELS, labelFor } from '@/constants/enums'
import { ControlButton } from '@/features/room/components/call/ControlButton'
import type { DevicePreferences } from '@/features/room/components/call/CallProvider'
import type { AccessInfo } from '@/features/room/types'
import { ROOM_ROLE_LABELS } from '@/features/room/utils/labels'
import { paths } from '@/routes/paths'

const PREFS_KEY = 'innerview.devices'

function loadPrefs(): DevicePreferences {
  try {
    return { audio: true, video: true, ...JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}') }
  } catch {
    return { audio: true, video: true }
  }
}

function savePrefs(prefs: DevicePreferences) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
  } catch {
    // Choices just won't be remembered.
  }
}

/** Camera preview and device pickers (like Meet's green room). Stops the preview on unmount. */
function DevicePreview({ prefs, onChange, onBlocked }: { prefs: DevicePreferences; onChange: (prefs: DevicePreferences) => void; onBlocked: (blocked: boolean) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let stream: MediaStream | null = null
    let cancelled = false
    if (!prefs.video && !prefs.audio) return
    navigator.mediaDevices
      ?.getUserMedia({
        video: prefs.video ? (prefs.videoDeviceId ? { deviceId: { exact: prefs.videoDeviceId } } : true) : false,
        audio: prefs.audio ? (prefs.audioDeviceId ? { deviceId: { exact: prefs.audioDeviceId } } : true) : false,
      })
      .then(async (media) => {
        if (cancelled) {
          media.getTracks().forEach((track) => track.stop())
          return
        }
        stream = media
        setError(null)
        onBlocked(false)
        if (videoRef.current) videoRef.current.srcObject = media
        setDevices(await navigator.mediaDevices.enumerateDevices())
      })
      .catch(() => {
        setError('Camera or microphone blocked — allow access in your browser, or join without them.')
        onBlocked(true)
      })
    return () => {
      cancelled = true
      stream?.getTracks().forEach((track) => track.stop())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefs.video, prefs.audio, prefs.videoDeviceId, prefs.audioDeviceId])

  const cameras = devices.filter((d) => d.kind === 'videoinput')
  const microphones = devices.filter((d) => d.kind === 'audioinput')

  return (
    <div className="space-y-3">
      <div className="relative aspect-video overflow-hidden rounded-xl bg-stage">
        {prefs.video && !error ? (
          <video ref={videoRef} autoPlay playsInline muted className="h-full w-full -scale-x-100 object-cover" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-sm text-white/70">
            <VideoOff className="h-6 w-6" aria-hidden />
            {error ?? 'Camera is off'}
          </div>
        )}
      </div>
      {/* Below the preview, not on it: nothing covers your face. */}
      <div className="flex items-center justify-center gap-2">
        <ControlButton
          label={prefs.audio ? 'Turn microphone off' : 'Turn microphone on'}
          icon={prefs.audio ? Mic : MicOff}
          state={prefs.audio ? 'on' : 'off'}
          pressed={!prefs.audio}
          onClick={() => onChange({ ...prefs, audio: !prefs.audio })}
        />
        <ControlButton
          label={prefs.video ? 'Turn camera off' : 'Turn camera on'}
          icon={prefs.video ? Video : VideoOff}
          state={prefs.video ? 'on' : 'off'}
          pressed={!prefs.video}
          onClick={() => onChange({ ...prefs, video: !prefs.video })}
        />
      </div>
      {(cameras.length > 1 || microphones.length > 1) && (
        <div className="grid gap-2 sm:grid-cols-2">
          {microphones.length > 1 && (
            <Select aria-label="Microphone" className="h-9 text-[13px]" value={prefs.audioDeviceId ?? ''} onChange={(e) => onChange({ ...prefs, audioDeviceId: e.target.value || undefined })}>
              {microphones.map((d, i) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Microphone ${i + 1}`}
                </option>
              ))}
            </Select>
          )}
          {cameras.length > 1 && (
            <Select aria-label="Camera" className="h-9 text-[13px]" value={prefs.videoDeviceId ?? ''} onChange={(e) => onChange({ ...prefs, videoDeviceId: e.target.value || undefined })}>
              {cameras.map((d, i) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Camera ${i + 1}`}
                </option>
              ))}
            </Select>
          )}
        </div>
      )}
    </div>
  )
}

function Countdown({ to }: { to: string }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])
  const ms = Math.max(0, new Date(to).getTime() - now)
  const minutes = Math.floor(ms / 60_000)
  if (minutes >= 60 * 24) return <>in {Math.round(minutes / 60 / 24)} days</>
  if (minutes >= 60) return <>in {Math.floor(minutes / 60)} h {minutes % 60} min</>
  return (
    <>
      in {minutes}:{String(Math.floor((ms % 60_000) / 1000)).padStart(2, '0')}
    </>
  )
}

interface PreJoinScreenProps {
  access: AccessInfo
  onJoin: (devices: DevicePreferences) => void
  onKnock: () => void
  onCancelKnock: () => void
  busy: boolean
}

/** The room URL before entering: device check, who's there, and join / ask to join / waiting. */
export function PreJoinScreen({ access, onJoin, onKnock, onCancelKnock, busy }: PreJoinScreenProps) {
  const [prefs, setPrefs] = useState(loadPrefs)
  // Devices the browser refused: join with them off instead of failing in the call.
  const [devicesBlocked, setDevicesBlocked] = useState(false)
  const joinPrefs = devicesBlocked ? { ...prefs, audio: false, video: false } : prefs
  const changePrefs = (next: DevicePreferences) => {
    setPrefs(next)
    savePrefs(next)
  }

  const blocked: Record<string, { icon: typeof Ban; title: string; text: ReactNode } | undefined> = {
    NOT_INVITED: { icon: Ban, title: 'Invited people only', text: 'Only people the host invited can join this interview. Ask them to invite your email.' },
    DENIED: { icon: Ban, title: "You can't join this interview", text: 'Someone in the interview declined your requests to join.' },
    REMOVED: { icon: Ban, title: 'You were removed', text: 'Someone removed you from this interview, so you can’t rejoin.' },
    FULL: { icon: Users, title: 'This interview is full', text: 'It’s a one-on-one room and both seats are taken. Try again when someone leaves.' },
  }
  const blockedState = blocked[access.access]
  const showDevices = access.canJoin || access.access === 'MUST_ASK' || access.access === 'PENDING'

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <header className="flex h-14 items-center justify-between border-b border-border px-4 sm:px-6">
        <Link to={paths.home} aria-label="Home">
          <LogoMark size={28} />
        </Link>
        <ThemeToggle />
      </header>
      <main className="mx-auto grid w-full max-w-5xl flex-1 items-center gap-8 px-4 py-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:px-6">
        <div>{showDevices ? <DevicePreview prefs={prefs} onChange={changePrefs} onBlocked={setDevicesBlocked} /> : null}</div>

        <div className="space-y-5 text-center lg:text-left">
          <div>
            <p className="font-mono text-xs tracking-wider text-fg-muted">{access.displayCode}</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">{access.title || `${labelFor(INTERVIEW_TYPE_LABELS, access.type)} interview`}</h1>
            {access.hostName && <p className="mt-1 text-sm text-fg-muted">Hosted by {access.hostName}</p>}
          </div>

          {access.participantsInside.length > 0 ? (
            <p className="text-sm text-fg-secondary">
              {access.participantsInside.slice(0, 3).join(', ')}
              {access.participantsInside.length > 3 ? ` and ${access.participantsInside.length - 3} more` : ''}
              {access.participantsInside.length === 1 ? ' is' : ' are'} in this interview
            </p>
          ) : (
            showDevices && <p className="text-sm text-fg-muted">No one else is here yet</p>
          )}

          {access.canJoin && (
            <div className="space-y-2">
              {access.alreadyConnected && <p className="text-sm text-warning">You’re already in this interview in another tab or device.</p>}
              <Button size="lg" loading={busy} onClick={() => onJoin(joinPrefs)} leftIcon={<DoorOpen className="h-4 w-4" />}>
                {access.alreadyConnected ? 'Join here' : 'Join now'}
              </Button>
              {access.role && <p className="text-xs text-fg-muted">You’ll join as {ROOM_ROLE_LABELS[access.role].toLowerCase()}.</p>}
            </div>
          )}

          {access.access === 'MUST_ASK' && (
            <div className="space-y-2">
              <Button size="lg" loading={busy} onClick={onKnock}>
                Ask to join
              </Button>
              <p className="text-xs text-fg-muted">The host or an interviewer will let you in.</p>
            </div>
          )}

          {access.access === 'PENDING' && (
            <div className="space-y-3">
              <p className="flex items-center justify-center gap-2 text-sm lg:justify-start">
                <Hourglass className="h-4 w-4 animate-pulse text-primary" aria-hidden /> Asking to be let in…
              </p>
              <p className="text-xs text-fg-muted">You’ll join automatically once someone admits you. If nobody answers within 10 minutes, you can ask again.</p>
              <Button variant="secondary" onClick={onCancelKnock}>
                Cancel
              </Button>
            </div>
          )}

          {access.access === 'NOT_STARTED' && access.startTime && (
            <div className="space-y-2">
              <p className="flex items-center justify-center gap-2 text-sm lg:justify-start">
                <CalendarClock className="h-4 w-4 text-primary" aria-hidden />
                Starts {new Date(access.startTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
              {access.joinOpensAt && (
                <p className="text-xs text-fg-muted">
                  You can join 10 minutes early — <Countdown to={access.joinOpensAt} />. This page updates by itself.
                </p>
              )}
            </div>
          )}

          {blockedState && (
            <div className="rounded-xl border border-border bg-surface p-4 text-left">
              <p className="flex items-center gap-2 font-medium">
                <blockedState.icon className="h-4 w-4 text-danger" aria-hidden /> {blockedState.title}
              </p>
              <p className="mt-1 text-sm text-fg-muted">{blockedState.text}</p>
            </div>
          )}

          {(access.access === 'ENDED' || access.access === 'CANCELLED') && (
            <div className="space-y-3">
              <p className="text-sm text-fg-secondary">{access.access === 'ENDED' ? 'This interview has ended.' : 'This interview was cancelled.'}</p>
              <div className="flex flex-wrap justify-center gap-2 lg:justify-start">
                {access.access === 'ENDED' && (
                  <Link to={paths.interview(access.interviewId)} className={buttonClasses()}>
                    View summary
                  </Link>
                )}
                <Link to={paths.home} className={buttonClasses({ variant: 'secondary' })}>
                  Back to home
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
