import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { paths } from '@/routes/paths'
import { PUBLIC_PAGES } from '@/seo/site'
import { HIRE_SIGNALS } from '@/features/marketing/rubric'
import { A, CallToAction, ContentPage, formatDate, H2, H3, OL, P, Related, Strong, Table, UL } from '@/features/marketing/components/MarketingLayout'

const page = PUBLIC_PAGES.mockInterviewWithAFriend

export default function MockInterviewWithAFriendPage() {
  useDocumentTitle(page.title)
  return (
    <ContentPage
      crumbs={[
        { to: paths.home, label: 'Home' },
        { to: page.path, label: 'Mock interview with a friend' },
      ]}
      eyebrow="Guide"
      title="How to run a mock technical interview with a friend"
      lead={
        <>
          A friend who agrees to interview you is the cheapest mock interview there is, and often the least useful: they go
          easy, hint too early and soften the feedback. This guide fixes that with a fixed structure, ground rules you agree
          on beforehand, and a scorecard for each type of round.
        </>
      }
      meta={<>By the InnerViewHub team · Updated {formatDate(page.lastModified)}</>}
    >
      <H2 id="why">Why mock interviews with friends go wrong</H2>
      <P>
        The problem isn’t your friend’s skill. It’s the relationship. People who like you don’t want to watch you struggle,
        so they fill silences, nod at half-finished ideas and end with “that was great”. A real interviewer does none of
        those things. The fix is to make the session less personal: a clock, a written scorecard, and an agreement that
        the interviewer’s job is to find the weak spots.
      </P>

      <H2 id="before">Before the session</H2>
      <OL>
        <li>
          <Strong>Pick the round you’re actually facing.</Strong> Coding, system design, a general technical round or a
          behavioral interview each need a different setup and different questions. Don’t practice coding the week before a
          design round.
        </li>
        <li>
          <Strong>The interviewer picks the question.</Strong> The candidate must not see it in advance. If you’re trading
          sessions, each person prepares the question they’ll ask the other.
        </li>
        <li>
          <Strong>Agree on three rules out loud.</Strong> No hints for the first five minutes of being stuck; the clock is
          not paused for any reason; feedback must include at least two things to improve.
        </li>
        <li>
          <Strong>Decide who takes notes.</Strong> The interviewer writes timestamped notes during the session. If a third
          person joins as an observer, they can take notes too and compare afterwards.
        </li>
      </OL>

      <H2 id="timing">How long each round should take</H2>
      <P>Real interviews run 30 to 60 minutes. Keep the same length, and always leave time for feedback.</P>
      <Table
        caption="Mock interview length by round"
        head={['Round', 'Interview', 'Feedback', 'Notes']}
        rows={[
          ['Coding', '35 min', '10 min', 'One medium problem plus a follow-up beats two easy ones.'],
          ['System design', '50 min', '10 min', 'Requirements, high-level design, then one deep dive.'],
          ['Technical (mixed)', '45 min', '10 min', 'A short coding task and a design discussion, or fundamentals questions.'],
          ['Behavioral', '25 min', '10 min', 'Three or four questions, each answered in under three minutes.'],
        ]}
      />
      <P>
        Trading sessions? Do one round each, back to back, with feedback after each. Two 45-minute sessions in an evening is
        plenty; quality drops after that.
      </P>

      <H2 id="during">During the session: the interviewer’s script</H2>
      <H3>Opening (2 minutes)</H3>
      <P>
        Introduce yourself as you would to a stranger, explain the format (“45 minutes, one problem, then feedback”) and read
        the prompt once. Don’t add clarifications the candidate didn’t ask for: asking good clarifying questions is part of
        what you’re assessing.
      </P>
      <H3>While they work</H3>
      <UL>
        <li>Stay quiet while they think. Write down the time whenever something notable happens.</li>
        <li>Answer questions about the problem precisely and briefly. Don’t volunteer the approach.</li>
        <li>
          When they’re stuck for a few minutes, use a hint ladder: first ask a question (“what’s slow about this?”), then a
          nudge (“could sorting help?”), and only then a direct hint. Note which rung they needed.
        </li>
        <li>Ask at least one follow-up that changes the problem: bigger input, a new constraint, a failure.</li>
      </UL>
      <H3>Closing (2 minutes)</H3>
      <P>
        Stop on time even if they’re close. Unfinished solutions happen in real interviews, and how someone summarises where
        they got to is worth practicing.
      </P>

      <H2 id="feedback">How to give feedback that actually helps</H2>
      <OL>
        <li>
          <Strong>Score before you talk.</Strong> Fill in the scorecard alone first. Once the conversation starts, the
          candidate’s explanations will soften your judgement.
        </li>
        <li>
          <Strong>Use the criteria for that round.</Strong> A design interview is judged on requirements, high-level design,
          deep dive and trade-offs; a behavioral one on structure, impact and self-awareness. The{' '}
          <A to={paths.feedbackRubric}>feedback rubric</A> lists them all with a 1–5 scale.
        </li>
        <li>
          <Strong>Give evidence, not adjectives.</Strong> “At minute 18 you changed the data structure without saying why”
          beats “communication could be better”.
        </li>
        <li>
          <Strong>Commit to a hire signal.</Strong> Pick one of {HIRE_SIGNALS.join(', ')}. “It depends” teaches nothing; a
          clear “lean no hire, because…” does.
        </li>
        <li>
          <Strong>End with the one thing to fix next time.</Strong> Two or three improvements, with the most important first.
        </li>
      </OL>
      <P>
        Then swap: the candidate rates the interviewer on clarity, helpfulness and professionalism. Being a good interviewer
        is a skill, and it’s the side of the table where you learn what strong answers look like.
      </P>

      <H2 id="after">After the session</H2>
      <UL>
        <li>Write down the two improvements somewhere you’ll see them before the next session.</li>
        <li>Look at the saved code or whiteboard and find the moment things went sideways.</li>
        <li>Schedule the next session now, with the same partner or a new one. Different interviewers catch different things.</li>
        <li>Track scores per criterion over several sessions; a single score is noise, a trend is signal.</li>
      </UL>

      <H2 id="mistakes">Common mistakes</H2>
      <Table
        caption="Common mock interview mistakes and fixes"
        head={['Mistake', 'Fix']}
        rows={[
          ['Using a problem the candidate has seen', 'The interviewer picks from a list the candidate hasn’t looked at.'],
          ['Pausing the clock for questions', 'Questions are part of the interview; the clock keeps running.'],
          ['Hinting at the first silence', 'Wait, then use the hint ladder, and record which hint was needed.'],
          ['Feedback that is only positive', 'The rule: at least two concrete improvements, every time.'],
          ['Practicing only one side', 'Trade roles; interviewing sharpens your own answers.'],
          ['Skipping the follow-up', 'Always change the problem once; adapting is a large part of the signal.'],
        ]}
      />

      <H2 id="tools">What you need to run it</H2>
      <P>
        At minimum: a video call, something you can both type or draw in, a timer and a place to write feedback. InnerViewHub
        puts those in one room: video, a{' '}
        <A to={paths.mockCodingInterview}>shared editor you can run code in</A>, a{' '}
        <A to={paths.systemDesignMockInterview}>shared whiteboard for design rounds</A>, private notes for the interviewer and
        the scorecard at the end. You invite your partner; nobody else gets in unless you let them.
      </P>

      <CallToAction title="Ready to try it?">Create a free account, open a room and send the link to your partner.</CallToAction>

      <Related
        links={[
          { to: paths.feedbackRubric, title: 'Mock interview feedback rubric', text: 'Criteria and 1–5 anchors for every type of round.' },
          { to: paths.systemDesignMockInterview, title: 'System design mock interviews', text: 'A 60-minute plan and prompts with deep-dive hooks.' },
        ]}
      />
    </ContentPage>
  )
}
