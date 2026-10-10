import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Code2,
  DoorOpen,
  FileText,
  History,
  Lock,
  MessageSquare,
  PenTool,
  Sparkles,
  SquareTerminal,
  Video,
  type LucideIcon,
} from 'lucide-react'
import { buttonClasses } from '@/components/common/Button'
import { LogoMark } from '@/components/common/Logo'
import { INTERVIEW_TYPE_DESCRIPTIONS, INTERVIEW_TYPE_LABELS, INTERVIEW_TYPES, type InterviewType } from '@/constants/enums'
import { Reveal, useInView } from '@/features/landing/components/Reveal'
import { RoomPreview } from '@/features/landing/components/RoomPreview'
import { SiteFooter, SiteHeader } from '@/features/marketing/components/MarketingLayout'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { cn } from '@/lib/utils'
import { paths } from '@/routes/paths'
import { PUBLIC_PAGES } from '@/seo/site'

const NAV = [
  { href: '#how', label: 'How it works' },
  { href: '#types', label: 'Interview types' },
  { href: '#room', label: 'The room' },
  { href: '#feedback', label: 'Feedback' },
  { href: '#faq', label: 'FAQ' },
]

function SectionHeading({ eyebrow, title, children }: { eyebrow: string; title: React.ReactNode; children?: React.ReactNode }) {
  return (
    <Reveal className="max-w-2xl">
      <p className="font-mono text-xs tracking-wide text-primary uppercase">{eyebrow}</p>
      <h2 className="mt-3 font-display text-4xl leading-[1.05] tracking-tight sm:text-5xl">{title}</h2>
      {children && <p className="mt-4 text-[17px] leading-relaxed text-fg-secondary">{children}</p>}
    </Reveal>
  )
}

// ── How it works ──────────────────────────────────────────────────────────────

const STEPS = [
  { title: 'Set up the room', text: 'Start now or schedule for later, and pick the kind of interview. The room opens with the right tools.' },
  { title: 'Invite your partner', text: 'Send an email invite or share the link. Anyone else has to ask to join — you let them in.' },
  { title: 'Interview for real', text: 'Talk face to face, write and run code in one editor, sketch the architecture on a shared whiteboard.' },
  { title: 'Trade feedback', text: 'Rate each other on the criteria that matter for that interview; the interviewer adds a hire signal.' },
]

function Steps() {
  const [ref, inView] = useInView<HTMLOListElement>()
  return (
    <ol ref={ref} className="relative mt-14 grid gap-10 md:grid-cols-4 md:gap-6">
      {/* The line that connects the steps draws itself in as the section scrolls into view. */}
      <span className="absolute top-[15px] right-[12%] left-[12%] hidden h-px bg-border md:block" aria-hidden>
        <span
          className="block h-full origin-left bg-primary transition-transform duration-[1400ms] ease-[var(--ease-out-soft)]"
          style={{ transform: inView ? 'scaleX(1)' : 'scaleX(0)' }}
        />
      </span>
      {STEPS.map((step, index) => (
        <li
          key={step.title}
          className="relative flex gap-4 transition-[opacity,transform] duration-700 ease-[var(--ease-out-soft)] md:flex-col md:items-center md:text-center"
          style={{ opacity: inView ? 1 : 0, transform: inView ? 'none' : 'translateY(12px)', transitionDelay: `${200 + index * 220}ms` }}
        >
          <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/50 bg-bg font-mono text-xs text-primary">
            {index + 1}
          </span>
          <div>
            <h3 className="text-base font-semibold">{step.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-fg-secondary md:mx-auto md:max-w-60">{step.text}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}

// ── Interview types ───────────────────────────────────────────────────────────

type Pane = 'problem' | 'editor' | 'canvas' | 'video'

const TYPE_DETAILS: Record<InterviewType, { prompt: string; panes: Pane[] }> = {
  PROBLEM_SOLVING: { prompt: 'Find the longest substring without repeating characters.', panes: ['problem', 'editor', 'video'] },
  SYSTEM_DESIGN: { prompt: 'Design a URL shortener that serves 10k redirects a second.', panes: ['problem', 'canvas', 'video'] },
  TECHNICAL: { prompt: 'Walk me through how a database index speeds up reads.', panes: ['problem', 'editor', 'canvas', 'video'] },
  HR: { prompt: 'Tell me about a time you disagreed with a teammate.', panes: ['video'] },
}

const PANES: Record<Pane, { label: string; icon: LucideIcon }> = {
  problem: { label: 'Problem', icon: FileText },
  editor: { label: 'Code', icon: Code2 },
  canvas: { label: 'Whiteboard', icon: PenTool },
  video: { label: 'Video', icon: Video },
}

function InterviewTypes() {
  const [active, setActive] = useState<InterviewType>('PROBLEM_SOLVING')
  const details = TYPE_DETAILS[active]

  return (
    <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-12">
      <div role="tablist" aria-label="Interview types" className="flex flex-col">
        {INTERVIEW_TYPES.map((type) => {
          const selected = type === active
          return (
            <button
              key={type}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls="interview-type-panel"
              onClick={() => setActive(type)}
              onMouseEnter={() => setActive(type)}
              className={cn(
                'group relative border-b border-border py-5 pl-5 text-left transition-colors first:border-t',
                selected ? 'text-fg' : 'text-fg-muted hover:text-fg',
              )}
            >
              <span className={cn('absolute top-5 bottom-5 left-0 w-[3px] rounded-full transition-colors', selected ? 'bg-primary' : 'bg-transparent')} aria-hidden />
              <span className="block text-xl font-semibold tracking-tight sm:text-2xl">{INTERVIEW_TYPE_LABELS[type]}</span>
              <span className={cn('mt-1 block text-sm transition-colors', selected ? 'text-fg-secondary' : 'text-fg-muted')}>{INTERVIEW_TYPE_DESCRIPTIONS[type]}</span>
            </button>
          )
        })}
      </div>

      <div id="interview-type-panel" role="tabpanel" className="flex flex-col justify-center rounded-2xl border border-border bg-surface p-5 sm:p-7">
        <p className="font-mono text-xs text-fg-muted">Sample prompt</p>
        <p key={active} className="mt-2 animate-fade-in font-display text-2xl leading-snug tracking-tight sm:text-3xl">“{details.prompt}”</p>
        <p className="mt-7 font-mono text-xs text-fg-muted">The room opens with</p>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {(Object.keys(PANES) as Pane[]).map((pane) => {
            const on = details.panes.includes(pane)
            const { label, icon: Icon } = PANES[pane]
            return (
              <div
                key={pane}
                className={cn(
                  'flex aspect-[4/5] flex-col items-center justify-center gap-2 rounded-xl border text-xs font-medium transition-all duration-300',
                  on ? 'border-primary/40 bg-primary/10 text-fg' : 'border-dashed border-border text-fg-muted',
                )}
              >
                <Icon className={cn('h-5 w-5 transition-colors', on ? 'text-primary' : '')} aria-hidden />
                {label}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── The room ──────────────────────────────────────────────────────────────────

const ROOM_FEATURES: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Video, title: 'Video, built in', text: 'No separate call link. Faces stay beside the work, never on top of it.' },
  { icon: Code2, title: 'One shared editor', text: 'Live cursors for everyone, with highlighting for Python, Java, C++, Go, Rust and more.' },
  { icon: SquareTerminal, title: 'Runnable code', text: 'Run it in a shared terminal everyone can see — and type input into.' },
  { icon: PenTool, title: 'System-design whiteboard', text: 'Boxes, arrows and scribbles on one canvas, synced as you draw.' },
  { icon: Lock, title: 'Private interviewer notes', text: 'Interviewers keep notes the candidate never sees.' },
  { icon: DoorOpen, title: 'A lobby with a door', text: 'Invited people walk in; anyone else asks. Swap interviewer and candidate in one click.' },
  { icon: MessageSquare, title: 'Chat on demand', text: 'Paste a link or a hint without leaving the code. Saved with the interview.' },
  { icon: History, title: 'A summary afterwards', text: 'The code, notes, whiteboard and chat are saved — replay how the solution came together.' },
]

// ── Copilot (in development) ──────────────────────────────────────────────────

const SUGGESTIONS = [
  { label: 'Follow-up', text: 'Ask how the solution changes if the input is a stream.' },
  { label: 'Signal', text: 'Explained the trade-off before coding — strong communication.' },
  { label: 'Time', text: '12 minutes left. Leave room for testing.' },
]

function CopilotPreview() {
  const [ref, inView] = useInView<HTMLDivElement>()
  return (
    <div ref={ref} className="rounded-2xl border border-border bg-surface p-5 shadow-pop" aria-hidden>
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="h-4 w-4 text-primary" /> Copilot
        </p>
        <span className="rounded-md bg-elevated px-2 py-0.5 text-[11px] text-fg-muted">Interviewer only</span>
      </div>
      <ul className="mt-4 space-y-2.5">
        {SUGGESTIONS.map((item, index) => (
          <li
            key={item.label}
            className="rounded-xl border border-border-subtle bg-bg p-3 transition-[opacity,transform] duration-700 ease-[var(--ease-out-soft)]"
            style={{ opacity: inView ? 1 : 0, transform: inView ? 'none' : 'translateX(14px)', transitionDelay: `${300 + index * 450}ms` }}
          >
            <p className="font-mono text-[11px] text-primary uppercase">{item.label}</p>
            <p className="mt-1 text-sm leading-snug">{item.text}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ── Feedback ──────────────────────────────────────────────────────────────────

const SCORES = [
  { label: 'Problem solving', value: 4 },
  { label: 'Communication', value: 5 },
  { label: 'Code quality', value: 3 },
  { label: 'Testing', value: 4 },
]

function FeedbackPreview() {
  const [ref, inView] = useInView<HTMLDivElement>()
  return (
    <div ref={ref} className="rounded-2xl border border-border bg-surface p-5 shadow-pop sm:p-6" aria-hidden>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Feedback from Maya</p>
          <p className="text-xs text-fg-muted">Problem solving · Interviewer</p>
        </div>
        <span className="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary">Lean hire</span>
      </div>
      <dl className="mt-5 space-y-3.5">
        {SCORES.map((score, index) => (
          <div key={score.label} className="grid grid-cols-[8.5rem_1fr_1.5rem] items-center gap-3 text-sm">
            <dt className="text-fg-secondary">{score.label}</dt>
            <dd className="h-1.5 overflow-hidden rounded-full bg-elevated">
              <span
                className="block h-full origin-left rounded-full bg-primary transition-transform duration-1000 ease-[var(--ease-out-soft)]"
                style={{ transform: inView ? `scaleX(${score.value / 5})` : 'scaleX(0)', transitionDelay: `${200 + index * 150}ms` }}
              />
            </dd>
            <dd className="text-right font-mono text-xs text-fg-muted">{score.value}/5</dd>
          </div>
        ))}
      </dl>
      <blockquote className="mt-5 border-l-2 border-primary/50 pl-3 text-sm leading-relaxed text-fg-secondary">
        Clear thinking out loud and a clean first pass. Next time, walk through edge cases before you run it.
      </blockquote>
    </div>
  )
}

// ── FAQ ───────────────────────────────────────────────────────────────────────

const FAQ: { q: string; a: React.ReactNode }[] = [
  {
    q: 'Who is InnerViewHub for?',
    a: 'Software engineers preparing for coding, system design, technical or behavioral interviews, and the friend, colleague or mentor who interviews them.',
  },
  {
    q: 'Do you match me with a partner?',
    a: (
      <>
        No. You choose who interviews you and invite them by email or with the room link; anyone else has to ask to join. If
        you’re new to it, start with the{' '}
        <Link to={paths.mockInterviewWithAFriend} className="font-medium text-fg underline decoration-border underline-offset-4 hover:decoration-fg">
          guide to running a mock interview with a friend
        </Link>
        .
      </>
    ),
  },
  { q: 'What does it cost?', a: 'Creating an account and running interviews is free.' },
  {
    q: 'Which languages can I run?',
    a: 'Common interview languages including Python, Java, C, C++, C#, Go, Rust, JavaScript and TypeScript, in a shared terminal both of you can type input into.',
  },
  {
    q: 'Is the interview recorded?',
    a: 'The video isn’t recorded. The code, whiteboard, chat and the interviewer’s private notes are saved with the interview, and you can replay how the code came together.',
  },
  {
    q: 'Can someone else watch?',
    a: 'Yes. A third person can join as a read-only observer who follows along but can’t edit or run code, which suits a mentor watching two peers practice.',
  },
]

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  useDocumentTitle(PUBLIC_PAGES.home.title)

  return (
    <div className="min-h-dvh overflow-x-clip bg-bg">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-elevated focus:px-3 focus:py-2">
        Skip to content
      </a>

      <SiteHeader
        nav={
          <nav className="hidden items-center gap-1 md:flex" aria-label="Sections">
            {NAV.map((item) => (
              <a key={item.href} href={item.href} className="rounded-lg px-3 py-2 text-sm text-fg-secondary transition-colors hover:text-fg">
                {item.label}
              </a>
            ))}
          </nav>
        }
      />

      <main id="main">
        {/* Hero */}
        <section className="relative">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-[560px] opacity-50 [mask-image:linear-gradient(to_bottom,black,transparent)]"
            style={{ backgroundImage: 'radial-gradient(var(--color-border) 1px, transparent 1px)', backgroundSize: '24px 24px' }}
            aria-hidden
          />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pt-14 pb-20 sm:px-6 sm:pt-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-10 lg:pt-24 lg:pb-28">
            <div>
              <p className="inline-flex animate-rise items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-fg-secondary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Live mock interviews, peer to peer
              </p>
              <h1 className="mt-6 animate-rise-solid font-display text-[44px] leading-[1.02] tracking-tight [animation-delay:80ms] sm:text-6xl lg:text-[68px]">
                Rehearse the interview <em className="text-brand-gradient -mr-1 pr-1">with real people</em>, before the one that counts.
              </h1>
              <p className="mt-6 max-w-xl animate-rise text-lg leading-relaxed text-fg-secondary [animation-delay:160ms]">
                InnerViewHub puts you in a real interview room with another engineer — video, a shared editor and whiteboard — and ends with
                honest, structured feedback.
              </p>
              <div className="mt-8 flex animate-rise flex-wrap items-center gap-3 [animation-delay:240ms]">
                <Link to={paths.signup} className={buttonClasses({ size: 'lg' })}>
                  Start practicing <ArrowRight className="h-4 w-4" />
                </Link>
                <a href="#how" className={buttonClasses({ size: 'lg', variant: 'secondary' })}>
                  See how it works
                </a>
              </div>
              <p className="mt-5 animate-rise text-sm text-fg-muted [animation-delay:320ms]">
                Got a room code?{' '}
                <Link to={paths.join} className="font-medium text-fg underline decoration-border underline-offset-4 hover:decoration-fg">
                  Join an interview
                </Link>
              </p>
            </div>
            <div className="relative isolate animate-rise [animation-delay:200ms] lg:pl-4">
              {/* The logo's blue/violet meeting point, as a faint light behind the room. */}
              <div
                className="pointer-events-none absolute -inset-8 -z-10 blur-2xl"
                style={{
                  background:
                    'radial-gradient(45% 55% at 25% 55%, color-mix(in srgb, var(--color-brand-blue) 16%, transparent), transparent 70%), radial-gradient(45% 55% at 78% 45%, color-mix(in srgb, var(--color-brand-violet) 16%, transparent), transparent 70%)',
                }}
                aria-hidden
              />
              <RoomPreview />
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="scroll-mt-16 border-t border-border-subtle py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading eyebrow="How it works" title="From invite to feedback in four steps">
              No queue, no bots. Two people, one room, and a clear structure from start to finish.
            </SectionHeading>
            <Steps />
          </div>
        </section>

        {/* Interview types */}
        <section id="types" className="scroll-mt-16 border-t border-border-subtle bg-surface/50 py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading eyebrow="Interview types" title={<>Practice the round <em>you’re actually facing</em></>}>
              Each type opens the room with the tools that round needs — and the feedback asks about what that round measures.
            </SectionHeading>
            <InterviewTypes />
            <Reveal className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <Link to={paths.mockCodingInterview} className="font-medium text-fg underline decoration-border underline-offset-4 hover:decoration-fg">
                How a mock coding interview works
              </Link>
              <Link to={paths.systemDesignMockInterview} className="font-medium text-fg underline decoration-border underline-offset-4 hover:decoration-fg">
                Plan a system design mock interview
              </Link>
            </Reveal>
          </div>
        </section>

        {/* The room */}
        <section id="room" className="scroll-mt-16 border-t border-border-subtle py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading eyebrow="The room" title="Everything an interview needs. Nothing it doesn’t.">
              The work gets the screen. Video sits beside it, and chat and people open only when you ask for them.
            </SectionHeading>
            <div className="mt-14 grid gap-x-10 sm:grid-cols-2 lg:grid-cols-4">
              {ROOM_FEATURES.map(({ icon: Icon, title, text }, index) => (
                <Reveal key={title} delay={(index % 4) * 90} className="border-t border-border py-6">
                  <Icon className="h-5 w-5 text-primary" aria-hidden />
                  <h3 className="mt-4 text-[15px] font-semibold">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-fg-secondary">{text}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Copilot */}
        <section id="copilot" className="scroll-mt-16 border-t border-border-subtle bg-surface/50 py-24">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
            <div>
              <SectionHeading eyebrow="Coming next" title="A copilot for the interviewer, not the candidate">
                We’re building an AI assistant that sits on the interviewer’s side of the table — suggesting follow-ups, noting signals as
                they happen and keeping an eye on the clock. The candidate never talks to it, and never sees it.
              </SectionHeading>
              <Reveal delay={120}>
                <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs text-fg-muted">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden /> In development — not available yet
                </p>
              </Reveal>
            </div>
            <Reveal delay={100} className="lg:pl-8">
              <CopilotPreview />
            </Reveal>
          </div>
        </section>

        {/* Feedback */}
        <section id="feedback" className="scroll-mt-16 border-t border-border-subtle py-24">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
            <Reveal className="order-2 lg:order-1 lg:pr-8">
              <FeedbackPreview />
            </Reveal>
            <div className="order-1 lg:order-2">
              <SectionHeading eyebrow="Feedback" title="Feedback specific enough to act on">
                After every session, you rate each other on the criteria for that interview type and leave a few honest words — and
                the interviewer adds a hire signal. Reviews and your rating build up over time, so you can see what’s improving.
              </SectionHeading>
              <Reveal delay={120}>
                <p className="mt-6 text-sm">
                  <Link to={paths.feedbackRubric} className="font-medium text-fg underline decoration-border underline-offset-4 hover:decoration-fg">
                    See the full feedback rubric for each interview type
                  </Link>
                </p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-16 border-t border-border-subtle bg-surface/50 py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading eyebrow="FAQ" title="Questions people ask first" />
            <dl className="mt-12 grid gap-x-12 gap-y-10 md:grid-cols-2">
              {FAQ.map((item) => (
                <Reveal key={item.q}>
                  <dt className="text-base font-semibold">{item.q}</dt>
                  <dd className="mt-2 text-[15px] leading-relaxed text-fg-secondary">{item.a}</dd>
                </Reveal>
              ))}
            </dl>
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t border-border-subtle">
          <div className="mx-auto max-w-6xl px-4 py-24 text-center sm:px-6 sm:py-28">
            <Reveal>
              <LogoMark size={72} animated className="mx-auto mb-8" />
              <h2 className="mx-auto max-w-3xl font-display text-5xl leading-[1.02] tracking-tight sm:text-6xl">
                Your next interview is <em className="text-brand-gradient -mr-1 pr-1">a rehearsal away</em>.
              </h2>
              <p className="mx-auto mt-5 max-w-lg text-lg text-fg-secondary">Create an account, open a room, and invite someone you trust to be tough on you.</p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link to={paths.signup} className={buttonClasses({ size: 'lg' })}>
                  Create a free account <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to={paths.login} className={buttonClasses({ size: 'lg', variant: 'secondary' })}>
                  Sign in
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
