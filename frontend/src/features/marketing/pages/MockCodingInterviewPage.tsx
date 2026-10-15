import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { paths } from '@/routes/paths'
import { PUBLIC_PAGES } from '@/seo/site'
import { HIRE_SIGNALS, RUBRICS } from '@/features/marketing/rubric'
import { A, CallToAction, ContentPage, H2, H3, OL, P, Related, Strong, Table, UL } from '@/features/marketing/components/MarketingLayout'

const page = PUBLIC_PAGES.mockCodingInterview

const PRACTICE_SET = [
  ['Longest substring without repeating characters', 'Sliding window', 'Does the candidate explain why the window only moves forward?'],
  ['Merge overlapping intervals', 'Sorting', 'Edge cases: touching intervals, a single interval, unsorted input.'],
  ['Top K frequent elements', 'Hash map + heap', 'Can they compare a heap with bucket sort and justify the choice?'],
  ['LRU cache', 'Design + data structures', 'O(1) get and put; do they test eviction order?'],
  ['Course schedule', 'Graphs, topological sort', 'Cycle detection, and how they represent the graph.'],
  ['Validate a binary search tree', 'Recursion', 'The classic bug: checking only the direct children.'],
]

export default function MockCodingInterviewPage() {
  useDocumentTitle(page.title)
  return (
    <ContentPage
      crumbs={[
        { to: paths.home, label: 'Home' },
        { to: page.path, label: 'Mock coding interviews' },
      ]}
      eyebrow="Coding interviews"
      title="Mock coding interviews in one shared editor you can run"
      lead={
        <>
          Rehearse the coding round the way it happens on the day: someone watching, one editor you both type in, code that
          has to actually run, and a scorecard at the end. InnerViewHub gives you the room; you bring the person who
          interviews you.
        </>
      }
    >
      <H2 id="room">What happens in a coding room</H2>
      <UL>
        <li>
          <Strong>One shared editor with live cursors.</Strong> Both people see every keystroke, with syntax highlighting for
          Python, Java, C++, Go, Rust, JavaScript, TypeScript and more.
        </li>
        <li>
          <Strong>Code that runs.</Strong> Run the program in a shared terminal that everyone in the room sees, and type input
          into it while it runs, so the interviewer can feed in their own test case.
        </li>
        <li>
          <Strong>Your own problems, with hidden tests.</Strong> Write a problem once with sample tests the candidate can see
          and hidden tests they can’t. In the room, “Run samples” checks the visible ones, and a submission is scored against
          all of them by weight, with verdicts such as accepted, wrong answer, time limit exceeded or compilation error.
        </li>
        <li>
          <Strong>Video, chat and private notes.</Strong> Video sits next to the code, chat is there for hints and links, and
          the interviewer keeps notes the candidate never sees.
        </li>
        <li>
          <Strong>A replay afterwards.</Strong> The code is saved, and you can replay how the solution came together, which
          is the easiest way to see where time went.
        </li>
      </UL>

      <H2 id="session-plan">A 45-minute session plan</H2>
      <Table
        caption="Coding mock interview timeline"
        head={['Minutes', 'Phase', 'What good looks like']}
        rows={[
          ['0–3', 'Problem', 'The interviewer reads the prompt once; the candidate restates it and asks about input size and edge cases.'],
          ['3–10', 'Approach', 'A brute force first, its complexity, then a better idea, before any code is written.'],
          ['10–30', 'Code', 'Readable code, explained while typing. The interviewer stays quiet unless the candidate is stuck for a few minutes.'],
          ['30–37', 'Test', 'Walk through an example by hand, then run it. Try the edge cases named at the start.'],
          ['37–45', 'Feedback', 'Scores and written notes first, then the conversation.'],
        ]}
      />
      <P>
        Agree on the hint policy before you start. A good default: no hints for the first five minutes of being stuck, then
        the smallest hint that unblocks (“what if the input were sorted?”) rather than the answer.
      </P>

      <H2 id="scorecard">The coding interview scorecard</H2>
      <P>
        For a problem-solving interview, InnerViewHub asks the interviewer to rate these five criteria from 1 to 5, and then
        give an overall signal from {HIRE_SIGNALS[0].toLowerCase()} to {HIRE_SIGNALS[HIRE_SIGNALS.length - 1].toLowerCase()}.
      </P>
      <Table caption="Coding interview scorecard" head={['Criterion', 'What a strong score means']} rows={RUBRICS.problemSolving.map((c) => [c.label, c.description])} />
      <P>
        The candidate rates the interviewer as well, on {RUBRICS.forInterviewer.map((c) => c.label.toLowerCase()).join(', ')}.
        Reviews build up over time, so you can see which criteria improve from one session to the next. See the{' '}
        <A to={paths.feedbackRubric}>feedback rubric</A> for what each score means.
      </P>

      <H2 id="practice-set">A starter practice set</H2>
      <P>
        Six well-known problems that cover the patterns coding rounds lean on. The third column is what the interviewer should
        watch for. Swap in your own once you have a rhythm.
      </P>
      <Table caption="Starter practice problems" head={['Problem', 'Pattern', 'What to watch for']} rows={PRACTICE_SET} />

      <H2 id="interviewer-tips">Tips for the person playing interviewer</H2>
      <OL>
        <li>
          <Strong>Don’t rescue too early.</Strong> Silence while someone thinks is normal. Note the time they got stuck and
          wait before hinting.
        </li>
        <li>
          <Strong>Ask “how would you test this?”</Strong> before they run anything. It separates people who run code to find
          bugs from people who reason about it.
        </li>
        <li>
          <Strong>Add one follow-up.</Strong> “What if the input doesn’t fit in memory?” shows how the candidate adapts.
        </li>
        <li>
          <Strong>Give feedback with evidence.</Strong> Quote the moment: “You wrote the loop before agreeing on the approach,
          and rewrote it at minute 24.”
        </li>
      </OL>

      <H2 id="faq">Common questions</H2>
      <H3>Which languages can we run?</H3>
      <P>
        Common interview languages including Python, Java, C, C++, C#, Go, Rust, JavaScript and TypeScript. The language
        picker in the room shows exactly what is installed.
      </P>
      <H3>Is it free?</H3>
      <P>Creating an account and running interviews is free.</P>
      <H3>What about system design?</H3>
      <P>
        Pick a <A to={paths.systemDesignMockInterview}>system design interview</A> and the room opens with a shared
        whiteboard instead of the editor.
      </P>

      <CallToAction title="Set up a coding mock">
        Create a room, choose “Problem solving”, and invite the person who will interview you.
      </CallToAction>

      <Related
        links={[
          { to: paths.mockInterviewWithAFriend, title: 'How to run a mock interview with a friend', text: 'A step-by-step plan for both sides of the table.' },
          { to: paths.systemDesignMockInterview, title: 'System design mock interviews', text: 'A 60-minute plan, prompts and the design scorecard.' },
        ]}
      />
    </ContentPage>
  )
}
