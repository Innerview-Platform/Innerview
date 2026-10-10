import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { paths } from '@/routes/paths'
import { PUBLIC_PAGES } from '@/seo/site'
import { HIRE_SIGNALS, RUBRICS } from '@/features/marketing/rubric'
import { A, CallToAction, ContentPage, H2, H3, OL, P, Related, Strong, Table, UL } from '@/features/marketing/components/MarketingLayout'

const page = PUBLIC_PAGES.systemDesignMockInterview

const PROMPTS = [
  ['URL shortener', 'Read-heavy traffic, ID generation, caching hot links, what happens when the cache is cold.'],
  ['Rate limiter', 'Where it sits (gateway or service), token bucket vs sliding window, sharing counters across nodes.'],
  ['Chat / messaging', 'Delivery guarantees, ordering within a conversation, online presence, offline delivery.'],
  ['News feed', 'Fan-out on write vs on read, the celebrity problem, ranking vs chronological.'],
  ['Notification service', 'Multiple channels, retries and idempotency, user preferences, rate limits per user.'],
  ['File storage and sharing', 'Chunked uploads, metadata vs blob storage, sharing permissions, deduplication.'],
]

export default function SystemDesignMockInterviewPage() {
  useDocumentTitle(page.title)
  return (
    <ContentPage
      crumbs={[
        { to: paths.home, label: 'Home' },
        { to: page.path, label: 'System design mock interviews' },
      ]}
      eyebrow="System design"
      title="System design mock interviews with a whiteboard you share"
      lead={
        <>
          Practice the system design round with someone you trust playing the interviewer. InnerViewHub opens a room with the
          prompt, a shared whiteboard and video side by side, and ends with a scorecard built for design interviews, not a
          generic “how did it go?”.
        </>
      }
    >
      <H2 id="room">What the room gives you</H2>
      <P>
        When you create a system design interview, the room opens with the tools that round needs and nothing else in the way.
      </P>
      <UL>
        <li>
          <Strong>A shared whiteboard.</Strong> Boxes, arrows and handwriting on one canvas that both of you draw on, synced as
          you go.
        </li>
        <li>
          <Strong>The prompt beside it.</Strong> The interviewer can load a problem statement into the room so the candidate
          isn’t working from memory.
        </li>
        <li>
          <Strong>Video in the room.</Strong> No separate call link; faces stay next to the diagram instead of covering it.
        </li>
        <li>
          <Strong>Private interviewer notes.</Strong> The interviewer can jot down signals as they happen; the candidate never
          sees them.
        </li>
        <li>
          <Strong>Chat</Strong> for pasting a number or a link without interrupting the drawing, saved with the interview.
        </li>
        <li>
          <Strong>A summary afterwards.</Strong> The whiteboard, notes and chat are saved, so you can look back at how the
          design evolved. The video is not recorded.
        </li>
      </UL>
      <P>
        You choose who interviews you: invite them by email or share the room link. Anyone else has to ask to join, and you
        decide whether to let them in. A third person can join as a read-only observer, which is a good way for a mentor to
        watch two peers practice.
      </P>

      <H2 id="session-plan">A 60-minute session plan</H2>
      <P>
        Most system design rounds last 45 to 60 minutes. This plan leaves time for feedback, which is the part that makes a
        mock interview worth doing. The interviewer keeps time and says when a phase is over.
      </P>
      <Table
        caption="System design mock interview timeline"
        head={['Minutes', 'Phase', 'What the interviewer listens for']}
        rows={[
          ['0–5', 'Framing', 'Does the candidate restate the problem and ask who the users are before drawing anything?'],
          ['5–12', 'Requirements', 'Functional requirements, then non-functional ones: scale, latency, consistency, availability. Rough numbers, out loud.'],
          ['12–30', 'High-level design', 'Main components, how data flows between them, the core APIs and the data model.'],
          ['30–45', 'Deep dive', 'One or two hard parts in depth: a bottleneck, a failure mode, a hot key, a consistency problem.'],
          ['45–50', 'Wrap-up', 'What would they change at 10× the load? What did they leave out on purpose?'],
          ['50–60', 'Feedback', 'Scores and written feedback first, then a conversation about the two biggest gaps.'],
        ]}
      />
      <P>
        If you only have 45 minutes, shorten the high-level design and keep the deep dive: it is where senior candidates
        separate themselves, and it is the part people skip when they practice alone.
      </P>

      <H2 id="scorecard">How the candidate is scored</H2>
      <P>
        After the session, the interviewer rates the candidate from 1 to 5 on each criterion below and writes a few honest
        sentences. These are the exact criteria InnerViewHub uses for system design interviews.
      </P>
      <Table
        caption="System design interview scorecard"
        head={['Criterion', 'What a strong score means']}
        rows={RUBRICS.systemDesign.map((c) => [c.label, c.description])}
      />
      <P>
        The interviewer also gives an overall hire signal on a six-step scale: {HIRE_SIGNALS.join(', ')}. Feedback runs both
        ways: the candidate rates the interviewer on {RUBRICS.forInterviewer.map((c) => c.label.toLowerCase()).join(', ')}, so
        the person playing interviewer gets better too. The <A to={paths.feedbackRubric}>full feedback rubric</A> explains how
        to score each level.
      </P>

      <H2 id="prompts">Prompts to practice</H2>
      <P>
        Pick a prompt the candidate hasn’t prepared. Each one below has a natural place to go deep; the interviewer should
        steer there if the candidate doesn’t.
      </P>
      <Table caption="System design practice prompts" head={['Design…', 'Where to push in the deep dive']} rows={PROMPTS} />

      <H2 id="interviewer-tips">Tips for the person playing interviewer</H2>
      <OL>
        <li>
          <Strong>Hold the numbers back.</Strong> Give scale figures (users, requests per second, data size) only when the
          candidate asks. Asking is part of the requirements score.
        </li>
        <li>
          <Strong>Pick one deep dive and stay there.</Strong> “What happens when this database goes down?” followed by two
          follow-ups tells you more than five shallow questions.
        </li>
        <li>
          <Strong>Ask for the trade-off, not the answer.</Strong> “Why a queue here instead of a direct call?” Good candidates
          name what they gave up.
        </li>
        <li>
          <Strong>Write notes with timestamps.</Strong> “At 22 min, chose SQL without discussing write volume” is feedback the
          candidate can act on; “needs more depth” is not.
        </li>
        <li>
          <Strong>Swap roles next time.</Strong> Interviewing someone else is one of the fastest ways to see what a strong
          answer looks like. One click swaps interviewer and candidate in the room.
        </li>
      </OL>

      <H2 id="faq">Common questions</H2>
      <H3>Do both people need an account?</H3>
      <P>Yes. Everyone in the room signs in, which is how the room knows who is the interviewer, the candidate or an observer.</P>
      <H3>Can we use our own problem?</H3>
      <P>
        Yes. You can write your own problems in InnerViewHub and load them into the room, or just say the prompt out loud and
        start drawing.
      </P>
      <H3>Is it free?</H3>
      <P>Creating an account and running interviews is free.</P>
      <H3>Can I practice coding rounds in the same place?</H3>
      <P>
        Yes. A <A to={paths.mockCodingInterview}>coding interview</A> opens with a shared editor you can run code in instead of
        the whiteboard, and a “technical” interview gives you both.
      </P>

      <CallToAction title="Run your first system design mock">
        Create a room, pick “System design”, and send the link to the person who will interview you.
      </CallToAction>

      <Related
        links={[
          { to: paths.mockInterviewWithAFriend, title: 'How to run a mock interview with a friend', text: 'Timing, ground rules and how to give feedback that helps.' },
          { to: paths.feedbackRubric, title: 'Mock interview feedback rubric', text: 'Scorecards for coding, system design, technical and behavioral rounds.' },
        ]}
      />
    </ContentPage>
  )
}
