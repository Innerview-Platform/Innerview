import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { paths } from '@/routes/paths'
import { PUBLIC_PAGES } from '@/seo/site'
import { HIRE_SIGNALS, RUBRICS, type RubricCriterion } from '@/features/marketing/rubric'
import { A, CallToAction, ContentPage, formatDate, H2, P, Related, Strong, Table, UL } from '@/features/marketing/components/MarketingLayout'

const page = PUBLIC_PAGES.feedbackRubric

/** What low and high scores sound like, per criterion label. Written for this page; keyed by round. */
const ANCHORS: Record<keyof typeof RUBRICS, Record<string, [string, string]>> = {
  problemSolving: {
    Communication: ['Coded in silence; the interviewer had to ask what they were doing.', 'Thought out loud, checked assumptions, and the interviewer was never lost.'],
    'Problem solving': ['Jumped into code, then rewrote it twice; needed a direct hint.', 'Compared two approaches with their complexity before writing anything.'],
    Correctness: ['Worked on the example only; failed on empty input or duplicates.', 'Handled the edge cases named at the start, without prompting.'],
    'Code quality': ['One long function, names like tmp2, repeated logic.', 'Small functions, clear names; easy to read on first pass.'],
    Testing: ['Ran the code and hoped; couldn’t state the complexity.', 'Traced an example by hand, then tested edge cases and stated time and space.'],
  },
  systemDesign: {
    Communication: ['Drew boxes without explaining them; hard to follow.', 'Narrated the design and kept checking the interviewer was with them.'],
    Requirements: ['Started drawing immediately; never asked about scale.', 'Separated functional from non-functional needs and estimated load out loud.'],
    'High-level design': ['Missing core pieces (storage, how data gets there).', 'Clear components, data flow and APIs that match the requirements.'],
    'Deep dive': ['Stayed at the box level when pushed on a bottleneck.', 'Went into the data model, a hot spot and a failure mode with specifics.'],
    'Trade-offs': ['One option presented as the only option.', 'Named alternatives, what each costs, and why they chose one.'],
  },
  technical: {
    Communication: ['Answers were hard to follow or off topic.', 'Clear, structured answers with the reasoning visible.'],
    'Problem solving': ['Needed heavy guidance to find any approach.', 'Found a sound approach independently and adapted to follow-ups.'],
    'Technical depth': ['Knew terms but not how things work underneath.', 'Explained the mechanism, not just the name, and its limits.'],
    'Code quality': ['Hard to read, inconsistent structure.', 'Readable and well structured, even under time pressure.'],
    Design: ['Didn’t consider how parts fit together.', 'Reasoned about architecture and the trade-offs of their choices.'],
  },
  behavioral: {
    Communication: ['Long, wandering answers; the point arrived late or never.', 'Concise answers, under three minutes, with the point up front.'],
    Structure: ['Missing the situation or the result.', 'Situation, task, action and result were all clear, without sounding scripted.'],
    Impact: ['“We did…” throughout; their own role was unclear.', 'Concrete results and what they personally owned.'],
    'Self-awareness': ['Couldn’t name a real mistake.', 'Described a real mistake, its cost, and what they do differently now.'],
    'Motivation & fit': ['Generic reasons that would fit any company.', 'Specific reasons tied to the role and their own goals.'],
  },
  forInterviewer: {},
}

const ROUNDS: { key: Exclude<keyof typeof RUBRICS, 'forInterviewer'>; id: string; title: string; intro: string }[] = [
  { key: 'problemSolving', id: 'coding', title: 'Coding (problem solving)', intro: 'For algorithm and data structure rounds in a shared editor.' },
  { key: 'systemDesign', id: 'system-design', title: 'System design', intro: 'For architecture rounds on a whiteboard.' },
  { key: 'technical', id: 'technical', title: 'Technical (mixed)', intro: 'For rounds that mix coding, fundamentals and design questions.' },
  { key: 'behavioral', id: 'behavioral', title: 'Behavioral / HR', intro: 'For conversation-based rounds about past experience.' },
]

const TEMPLATE = `Round: ___________   Date: ___________   Interviewer: ___________

Scores (1–5)
  ___________________  _
  ___________________  _
  ___________________  _
  ___________________  _
  ___________________  _

Hire signal: Strong hire / Hire / Lean hire / Lean no hire / No hire / Strong no hire

What went well (with timestamps)
  1.
  2.

What to improve next time (most important first)
  1.
  2.

Hints needed: none / question / nudge / direct hint`

function rows(key: keyof typeof RUBRICS, criteria: RubricCriterion[]) {
  return criteria.map((c) => [c.label, c.description, ANCHORS[key][c.label]?.[0] ?? '', ANCHORS[key][c.label]?.[1] ?? ''])
}

export default function FeedbackRubricPage() {
  useDocumentTitle(page.title)
  return (
    <ContentPage
      crumbs={[
        { to: paths.home, label: 'Home' },
        { to: page.path, label: 'Mock interview feedback rubric' },
      ]}
      eyebrow="Resource"
      title="A mock interview feedback rubric for every round"
      lead={
        <>
          Scorecards for coding, system design, technical and behavioral mock interviews, with what a low and a high score
          sound like, a six-step hire signal and a written-feedback template you can copy. They are the same criteria the
          InnerViewHub interview room uses.
        </>
      }
      meta={<>By the InnerViewHub team · Updated {formatDate(page.lastModified)}</>}
    >
      <H2 id="scale">The 1–5 scale</H2>
      <P>Score each criterion on its own, using what you saw in this session only.</P>
      <Table
        caption="Score anchors"
        head={['Score', 'Meaning']}
        rows={[
          ['1', 'Not shown, or a clear problem that would end a real interview.'],
          ['2', 'Attempted, with significant gaps; needed a direct hint to progress.'],
          ['3', 'Solid with some gaps; needed a nudge, not the answer.'],
          ['4', 'Strong and independent; small gaps only.'],
          ['5', 'Excellent; the interviewer would hold this up as an example.'],
        ]}
      />

      {ROUNDS.map((round) => (
        <section key={round.key}>
          <H2 id={round.id}>{round.title}</H2>
          <P>{round.intro}</P>
          <Table
            caption={`${round.title} scorecard`}
            head={['Criterion', 'What it measures', 'Sounds like a 2', 'Sounds like a 5']}
            rows={rows(round.key, RUBRICS[round.key])}
          />
        </section>
      ))}

      <H2 id="hire-signal">The overall hire signal</H2>
      <P>
        After scoring the criteria, the interviewer commits to one overall signal. Answer the question “if this were the real
        interview, would I want them on the team?”, not an average of the scores.
      </P>
      <UL>
        {HIRE_SIGNALS.map((signal) => (
          <li key={signal}>
            <Strong>{signal}</Strong>
          </li>
        ))}
      </UL>
      <P>
        There is deliberately no neutral middle option: “lean hire” or “lean no hire” forces a decision, which is what makes
        the signal useful.
      </P>

      <H2 id="interviewer">Rating the interviewer</H2>
      <P>Peer practice works both ways. The candidate rates the interviewer from 1 to 5 on:</P>
      <Table caption="Interviewer scorecard" head={['Criterion', 'What it measures']} rows={RUBRICS.forInterviewer.map((c) => [c.label, c.description])} />

      <H2 id="template">Written feedback template</H2>
      <P>Copy this into your notes, fill it in before you talk, then walk the candidate through it.</P>
      <pre className="mt-6 overflow-x-auto rounded-xl border border-border bg-surface p-5 font-mono text-[13px] leading-relaxed text-fg-secondary">
        {TEMPLATE}
      </pre>

      <H2 id="how-to-use">How to use the rubric well</H2>
      <UL>
        <li>Score alone, before discussing; the conversation will pull your scores toward the middle.</li>
        <li>Back every score of 2 or below with a moment from the session (“at minute 14…”).</li>
        <li>Compare scores across several sessions, not one. A trend in a single criterion is the most useful thing a rubric tells you.</li>
        <li>
          Read the <A to={paths.mockInterviewWithAFriend}>guide to running a mock interview with a friend</A> for timings, hint
          rules and how to deliver the feedback.
        </li>
      </UL>

      <CallToAction title="Use the rubric without the paperwork">
        In an InnerViewHub room, the scorecard for the round you picked opens as soon as the interview ends, and your reviews
        build up over time.
      </CallToAction>

      <Related
        links={[
          { to: paths.mockCodingInterview, title: 'Mock coding interviews', text: 'A shared editor you can run code in, plus a 45-minute plan.' },
          { to: paths.systemDesignMockInterview, title: 'System design mock interviews', text: 'Whiteboard, prompts and the design scorecard.' },
        ]}
      />
    </ContentPage>
  )
}
