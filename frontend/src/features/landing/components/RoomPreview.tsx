import { useEffect, useState } from 'react'
import { FileText, MessageSquare, Mic, MonitorUp, PhoneOff, Play, Users, Video } from 'lucide-react'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/utils'

type Token = { text: string; tone?: 'keyword' | 'function' | 'number' | 'variable' | 'comment' }

/** The solution the "candidate" types out, pre-tokenized for highlighting. */
const LINES: Token[][] = [
  [{ text: 'def ', tone: 'keyword' }, { text: 'two_sum', tone: 'function' }, { text: '(nums, target):' }],
  [{ text: '    seen = {}' }],
  [{ text: '    for ', tone: 'keyword' }, { text: 'i, n ' }, { text: 'in ', tone: 'keyword' }, { text: 'enumerate', tone: 'function' }, { text: '(nums):' }],
  [{ text: '        if ', tone: 'keyword' }, { text: 'target - n ' }, { text: 'in ', tone: 'keyword' }, { text: 'seen:' }],
  [{ text: '            return ', tone: 'keyword' }, { text: '[seen[target - n], i]' }],
  [{ text: '        seen[n] = i' }],
]
const TOTAL = LINES.reduce((sum, line) => sum + line.reduce((s, t) => s + t.text.length, 0) + 1, 0)

const TONE: Record<NonNullable<Token['tone']>, string> = {
  keyword: 'text-[var(--color-syntax-keyword)]',
  function: 'text-[var(--color-syntax-function)]',
  number: 'text-[var(--color-syntax-number)]',
  variable: 'text-[var(--color-syntax-variable)]',
  comment: 'text-[var(--color-syntax-comment)]',
}

type Phase = 'typing' | 'running' | 'asked'

/** Types the solution, runs it, then the interviewer asks a follow-up — and loops. */
function useScript(animate: boolean) {
  const [typed, setTyped] = useState(animate ? 0 : TOTAL)
  const [phase, setPhase] = useState<Phase>(animate ? 'typing' : 'asked')

  useEffect(() => {
    if (!animate) return
    let timer: ReturnType<typeof setTimeout>
    if (phase === 'typing') {
      if (typed < TOTAL) timer = setTimeout(() => setTyped((n) => n + 1), typed === 0 ? 900 : 38 + Math.random() * 45)
      else timer = setTimeout(() => setPhase('running'), 700)
    } else if (phase === 'running') {
      timer = setTimeout(() => setPhase('asked'), 1400)
    } else {
      timer = setTimeout(() => {
        setTyped(0)
        setPhase('typing')
      }, 5200)
    }
    return () => clearTimeout(timer)
  }, [animate, phase, typed])

  return { typed, phase }
}

function Code({ typed, showCursor }: { typed: number; showCursor: boolean }) {
  let remaining = typed
  return (
    <pre className="font-mono text-[11px] leading-[1.7] sm:text-[12px]">
      {LINES.map((line, index) => {
        if (remaining <= 0) return null
        const parts = line.map((token, i) => {
          const visible = token.text.slice(0, Math.max(0, remaining))
          remaining -= token.text.length
          return visible ? (
            <span key={i} className={token.tone ? TONE[token.tone] : undefined}>
              {visible}
            </span>
          ) : null
        })
        remaining -= 1 // newline
        const lastVisible = remaining <= 0
        return (
          <div key={index} className="flex">
            <span className="w-6 shrink-0 pr-2 text-right text-fg-muted/60 select-none">{index + 1}</span>
            <span className="whitespace-pre">
              {parts}
              {lastVisible && showCursor && <span className="ml-px inline-block h-[1.1em] w-[2px] translate-y-[2px] animate-blink bg-primary" />}
            </span>
          </div>
        )
      })}
    </pre>
  )
}

function Face({ name, role, initials, tone, speaking, compact }: { name: string; role: string; initials: string; tone: string; speaking: boolean; compact?: boolean }) {
  return (
    <figure className="flex min-h-0 flex-1 flex-col gap-1">
      <div className={cn('relative flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-lg bg-stage ring-2 transition-shadow duration-500', speaking ? 'ring-primary' : 'ring-transparent')}>
        {/* Soft "camera" light so the tile reads as video rather than an empty box. */}
        <div className="absolute inset-0 opacity-70" style={{ background: `radial-gradient(60% 70% at 50% 35%, ${tone}55, transparent 70%)` }} aria-hidden />
        <span
          className={cn('relative flex items-center justify-center rounded-full font-semibold text-white', compact ? 'h-7 w-7 text-[10px]' : 'h-10 w-10 text-xs')}
          style={{ backgroundColor: tone }}
        >
          {initials}
        </span>
      </div>
      <figcaption className="truncate text-[10px] text-fg-secondary">
        <span className="font-medium text-fg">{name}</span> · {role}
      </figcaption>
    </figure>
  )
}

/** A miniature, self-playing interview room for the hero. Decorative: hidden from assistive tech. */
export function RoomPreview() {
  const animate = !useMediaQuery('(prefers-reduced-motion: reduce)')
  const { typed, phase } = useScript(animate)
  const [seconds, setSeconds] = useState(41 * 60 + 12)
  useEffect(() => {
    if (!animate) return
    const timer = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 45 * 60)), 1000)
    return () => clearInterval(timer)
  }, [animate])
  const clock = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
  const interviewerSpeaking = phase === 'asked'

  return (
    <div className="relative select-none" aria-hidden>
      <div className="overflow-hidden rounded-2xl border border-border bg-bg shadow-pop">
        {/* header */}
        <div className="flex h-9 items-center justify-between border-b border-border bg-surface px-3">
          <div className="flex items-center gap-2">
            <span className="flex gap-1">
              <span className="h-2 w-2 rounded-full bg-border" />
              <span className="h-2 w-2 rounded-full bg-border" />
              <span className="h-2 w-2 rounded-full bg-border" />
            </span>
            <span className="ml-1 text-[11px] font-semibold">Problem solving</span>
            <span className="hidden font-mono text-[10px] text-fg-muted sm:inline">/ kdr-wqpa-nte</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-fg-secondary">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            <span className="rounded-md border border-border px-1.5 py-0.5 font-mono tabular-nums">{clock}</span>
          </div>
        </div>

        {/* body */}
        <div className="grid h-[300px] grid-cols-[1fr] gap-2 p-2 sm:h-[340px] sm:grid-cols-[0.8fr_1.6fr_0.8fr]">
          <div className="hidden min-h-0 flex-col rounded-lg border border-border bg-surface sm:flex">
            <div className="flex h-7 items-center gap-1.5 border-b border-border px-2 text-[10px] font-medium">
              <FileText className="h-3 w-3 text-primary" /> Problem
            </div>
            <div className="space-y-2 p-2.5 text-[10px] leading-relaxed text-fg-secondary">
              <p className="text-[11px] font-semibold text-fg">Two Sum</p>
              <p>Return the indices of the two numbers that add up to the target.</p>
              <p className="rounded bg-elevated px-1.5 py-1 font-mono text-[9.5px]">nums = [2, 7, 11, 15]<br />target = 9 → [0, 1]</p>
              <div className="space-y-1 pt-1">
                <span className="block h-1.5 w-11/12 rounded-full bg-elevated" />
                <span className="block h-1.5 w-3/4 rounded-full bg-elevated" />
              </div>
            </div>
          </div>

          <div className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-surface">
            <div className="flex h-7 shrink-0 items-center justify-between border-b border-border px-2">
              <span className="font-mono text-[10px] text-fg-secondary">solution.py</span>
              <span className={cn('flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors', phase === 'running' ? 'bg-primary text-on-primary' : 'bg-elevated text-fg-secondary')}>
                <Play className="h-2.5 w-2.5" /> Run
              </span>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden px-1 py-2">
              <Code typed={typed} showCursor={phase === 'typing'} />
            </div>
            <div className="h-[64px] shrink-0 border-t border-border bg-bg px-2.5 py-1.5 font-mono text-[10px] leading-relaxed">
              <p className="text-fg-muted">Terminal</p>
              {phase !== 'typing' && (
                <div className="animate-fade-in">
                  <p className="text-fg-muted italic">▶ Running Python (started by you)</p>
                  {phase === 'asked' && <p className="text-fg">[0, 1]</p>}
                </div>
              )}
            </div>
          </div>

          <div className="hidden min-h-0 flex-col gap-2 sm:flex">
            <Face name="Maya" role="Interviewer" initials="MR" tone="#7650f2" speaking={interviewerSpeaking} />
            <Face name="You" role="Candidate" initials="YO" tone="#3a56f0" speaking={phase === 'typing' && typed > 0} />
          </div>
        </div>

        {/* control bar */}
        <div className="flex h-11 items-center justify-between border-t border-border bg-surface px-3">
          <span className="w-16" />
          <div className="flex items-center gap-1.5">
            {[Mic, Video, MonitorUp].map((Icon, i) => (
              <span key={i} className="flex h-6 w-6 items-center justify-center rounded-full bg-elevated text-fg">
                <Icon className="h-3 w-3" />
              </span>
            ))}
            <span className="flex h-6 items-center gap-1 rounded-full bg-danger px-2 text-[10px] font-medium text-white">
              <PhoneOff className="h-3 w-3" /> Leave
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="flex h-6 items-center gap-1 rounded-full bg-elevated px-2 text-[10px]">
              <Users className="h-3 w-3" /> 2
            </span>
            <span className="relative flex h-6 items-center gap-1 rounded-full bg-elevated px-2 text-[10px]">
              <MessageSquare className="h-3 w-3" />
              {phase === 'asked' && <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-surface" />}
            </span>
          </div>
        </div>
      </div>

      {/* The interviewer's follow-up, arriving as a chat message — beside the faces, not over them. */}
      <div
        className={cn(
          'absolute right-3 bottom-14 w-56 rounded-xl border border-border bg-surface p-3 shadow-pop transition-all duration-500 ease-[var(--ease-out-soft)] sm:right-[27%]',
          phase === 'asked' ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0',
        )}
      >
        <p className="text-[10px] text-fg-muted">
          <span className="font-medium text-fg">Maya</span> · now
        </p>
        <p className="mt-1 text-[12px] leading-snug">Nice. What’s the time complexity — and could you do it in one pass?</p>
      </div>
    </div>
  )
}
