# Keyword → URL map and internal linking — InnerViewHub (2026-10-09)

One primary query cluster per URL, so pages don't compete with each other. Supporting queries are
answered by a section of the same page (anchor links), not by new pages. Research and limits:
[KEYWORD_RESEARCH.md](KEYWORD_RESEARCH.md). Titles and descriptions are defined in
`frontend/src/seo/site.ts` (the only place to change them).

## Map

| URL | Primary cluster | Supporting queries (answered on the page) | Must NOT target (belongs elsewhere) | Title (as served) | H1 |
|---|---|---|---|---|---|
| `/` | peer mock interviews for software engineers; mock technical interview (long term) | mock interview with a friend (tool), free peer mock interviews, innerviewhub | how-to guides, rubric details | Peer mock interviews for software engineers · InnerViewHub | Rehearse the interview with real people, before the one that counts. |
| `/system-design-mock-interview` | system design mock interview (with a peer/friend) | system design interview whiteboard (`#room`), timeline (`#session-plan`), design scorecard (`#scorecard`), practice prompts (`#prompts`) | generic rubric for all rounds | System design mock interviews with a peer · InnerViewHub | System design mock interviews with a whiteboard you share |
| `/mock-coding-interview` | mock coding interview with a peer/friend | coding interview practice with hidden tests, 45-min plan (`#session-plan`), coding scorecard (`#scorecard`), practice set (`#practice-set`) | system design | Mock coding interview practice with a peer · InnerViewHub | Mock coding interviews in one shared editor you can run |
| `/mock-interview-with-a-friend` | how to run a mock interview with a friend | mock interview tips for the interviewer (`#during`), friend goes easy (`#why`), how long mock interviews last (`#timing`), how to give feedback (`#feedback`) | the scorecards themselves (link to rubric) | How to run a mock interview with a friend · InnerViewHub | How to run a mock technical interview with a friend |
| `/mock-interview-feedback-rubric` | mock interview feedback rubric / scorecard template | system design rubric (`#system-design`), behavioral rubric (`#behavioral`), hire signal (`#hire-signal`), feedback template (`#template`) | how to run the session (link to guide) | Mock interview feedback rubric and scorecard · InnerViewHub | A mock interview feedback rubric for every round |
| `/login` | innerviewhub login | — | — | Sign in · InnerViewHub | Welcome back |
| `/signup` | innerviewhub sign up | — | — | Create account · InnerViewHub | Create your account |

Planned pages (see the editorial plan in [CONTENT_GAP_ANALYSIS.md](CONTENT_GAP_ANALYSIS.md)) get their
own row here before they're written: `/behavioral-interview-practice` (behavioral mock interview,
STAR practice with a friend), `/how-to-be-a-good-mock-interviewer`, `/compare/peer-mock-interview-platforms`
(pramp alternative, free peer mock interview platforms).

## Internal linking map

Every public page shares the header (Home, System design, Coding, Guide, Feedback rubric, Sign in,
Get started) and the footer (all content pages, join with a room code, account links). Contextual links
within the body carry the descriptive anchors:

| From | To | Anchor text (contextual) |
|---|---|---|
| `/` Interview types | `/mock-coding-interview` | How a mock coding interview works |
| `/` Interview types | `/system-design-mock-interview` | Plan a system design mock interview |
| `/` Feedback | `/mock-interview-feedback-rubric` | See the full feedback rubric for each interview type |
| `/` FAQ | `/mock-interview-with-a-friend` | guide to running a mock interview with a friend |
| `/system-design-mock-interview` | `/mock-interview-feedback-rubric` | full feedback rubric |
| `/system-design-mock-interview` | `/mock-coding-interview` | coding interview |
| `/system-design-mock-interview` | guide, rubric | Keep reading cards |
| `/mock-coding-interview` | `/mock-interview-feedback-rubric` | feedback rubric |
| `/mock-coding-interview` | `/system-design-mock-interview` | system design interview |
| `/mock-coding-interview` | guide, system design | Keep reading cards |
| `/mock-interview-with-a-friend` | `/mock-interview-feedback-rubric` | feedback rubric |
| `/mock-interview-with-a-friend` | `/mock-coding-interview` | shared editor you can run code in |
| `/mock-interview-with-a-friend` | `/system-design-mock-interview` | shared whiteboard for design rounds |
| `/mock-interview-feedback-rubric` | `/mock-interview-with-a-friend` | guide to running a mock interview with a friend |
| `/mock-interview-feedback-rubric` | coding, system design | Keep reading cards |
| every content page | `/` | Breadcrumb "Home" (+ BreadcrumbList markup) |

Click depth: every public page is one click from the home page (header and footer). Anchors vary and
describe the destination; no exact-match anchor is repeated site-wide except navigation labels.
`tests/seo/dist.check.mjs` fails if a sitemap page is linked from fewer than two other pages or if any
internal link in the prerendered HTML doesn't resolve.
