# Keyword research — InnerViewHub (2026-10-09)

## Method and limits (read first)

- **No search volume, keyword difficulty or traffic forecasts are given anywhere in this document.**
  No keyword tool (Ahrefs, Semrush, Google Keyword Planner) and no Search Console data were available,
  and the site has no search history yet. Numbers would be invented.
- **Competition** below is a qualitative read of the live results for each query: who ranks (large
  brands with many links vs. blogs and small tools) and how well their pages match the intent. It was
  collected on 2026-10-09 with a web search tool that returns a US index. **That index is not Google**,
  so treat positions as indicative.
- **Relevance** is judged against what the product does in code (see the product facts below), not
  against marketing copy.
- Once Search Console has 4–8 weeks of data, replace the qualitative columns with real impressions,
  clicks and positions (see [SEO_ROADMAP_90_DAYS.md](SEO_ROADMAP_90_DAYS.md), measurement plan).

## Product facts that constrain targeting

Verified in the codebase and production database:

| Fact | Consequence for keywords |
|---|---|
| You **invite your own partner** (email or link); others knock and you admit them. No matching with strangers. | Target "with a friend / peer / partner you choose". **Avoid** "find a mock interview partner", "get matched". |
| Four types: Problem solving, System design, Technical, HR/Behavioral, each with its own scorecard (`FeedbackRubric.java`). | Type-specific pages are justified; the rubric is a genuine, citable asset. |
| Shared editor with live cursors; code runs in a shared terminal (12 runtimes installed in production, incl. Python, Java, C, C++, C#, Go, Rust, JS, TS). | "mock coding interview", "coding interview practice with a friend". |
| Own problems with **sample and hidden test cases**, weighted scoring, verdicts (accepted, wrong answer, TLE, MLE, compile error). | Distinctive vs. plain shared editors (CodeBunk, CodeInterview). |
| Shared whiteboard (Excalidraw), video, private interviewer notes, chat, observers (read-only), code replay. | "system design mock interview", "system design interview whiteboard with video". |
| Video **not recorded**; problem library currently **empty** (0 problems); 14 registered users; no billing code. | No "question bank" or "thousands of users" claims. "Free" is accurate today. |
| AI interviewer copilot: in development, not shipped. | Don't target "AI mock interview". |
| Brand "InnerView" is shared with unrelated products (innerview.org, an AI user-research tool, an Ohio service-learning platform). The site isn't indexed for its own name yet. | Use **InnerViewHub** consistently; keep "InnerView" only as `alternateName`. |

## Keyword clusters

Relevance: **H** high, **M** medium, **L** low. Competition (qualitative): **Very high** (big brands
with large link profiles fill the page), **High**, **Medium** (blogs and small tools, mixed intent
match), **Low** (few pages match the exact intent). Business value: likelihood the searcher becomes a
user.

### Primary commercial / product

| Query | Intent | Rel. | Competition (who ranks) | Value | Target URL | Priority |
|---|---|---|---|---|---|---|
| mock technical interview | Commercial | H | Very high: Aced (formerly Exponent), interviewing.io, listicles (IGotAnOffer, FinalRound) | High | `/` | Long term |
| peer mock interview / peer mock interview platform | Commercial | H | High: Aced, Practick, Pramp legacy pages, "best platforms" lists | High | `/` | Medium |
| free peer mock interviews for software engineers | Commercial | H | High: Practick, Aced, roundups | High | `/` | Medium |
| mock interview with a friend (tool) | Commercial/tool | **H** | Medium: Aced "practice with a friend" feature, small tools | **High** | `/` + guide | **Now** |

### Product-specific (interview types)

| Query | Intent | Rel. | Competition | Value | Target URL | Priority |
|---|---|---|---|---|---|---|
| system design mock interview | Commercial + info | H | High: Educative, Design Gurus, Hello Interview, Codemia, GetMockInterview | High | `/system-design-mock-interview` | **Now** |
| system design mock interview with a friend / peer | Commercial | **H** | **Medium**: blog posts (Medium), few tools match | High | `/system-design-mock-interview` | **Now** |
| system design interview whiteboard (online, free) | Tool | M–H | Medium: SystemDesignBoard, theonsite.dev, CodeInterview whiteboard, GfG lists | Medium | `/system-design-mock-interview` | Next |
| mock coding interview | Commercial | H | Very high: LeetCode, Aced, interviewing.io | High | `/mock-coding-interview` | Long term |
| mock coding interview with a friend / coding interview practice with a peer | Commercial | **H** | **Medium**: CodeBunk, CodeInterview, Playcode, Aced, DEV posts | High | `/mock-coding-interview` | **Now** |
| collaborative code editor for interviews (with video, run code) | Tool | M | High: CoderPad, CodeInterview, CodeBunk (hiring tools) | Medium | `/mock-coding-interview` | Later |
| behavioral mock interview software engineer | Commercial + info | M | High: Tech Interview Handbook, MentorCruise, AI tools | Medium | `/mock-interview-feedback-rubric#behavioral` now; dedicated page later | Later |

### Informational / problem-oriented

| Query | Intent | Rel. | Competition | Value | Target URL | Priority |
|---|---|---|---|---|---|---|
| how to run a mock interview with a friend | Informational | **H** | **Medium**: Codex Interview playbook (~1,450 words, no rubric), Stanford page (non-technical), GetMockInterview | High (reader needs a tool next) | `/mock-interview-with-a-friend` | **Now** |
| how to conduct a mock technical interview / mock interview tips for interviewer | Informational | H | Medium: HackerEarth, general career sites | Medium | `/mock-interview-with-a-friend` | Now (same page) |
| my friend goes easy on me in mock interviews / mock interview feedback too nice | Problem | H | Low: covered as a paragraph in a few posts | Medium | `/mock-interview-with-a-friend#why` | Now (same page) |
| mock interview feedback rubric / template (software engineer) | Informational/template | **H** | **Medium**: zero2sudo Substack rubric, Prepfully, Indeed (non-tech), university PDFs | High (link-worthy) | `/mock-interview-feedback-rubric` | **Now** |
| system design interview rubric / scorecard | Informational | H | Medium: Aced blog posts on company rubrics, Hello Interview content | Medium | `/mock-interview-feedback-rubric#system-design` | Now (same page) |
| hire / no hire signal meaning, interview scorecard levels | Informational | M | Medium | Low–medium | `/mock-interview-feedback-rubric#hire-signal` | Now (same page) |
| how long is a system design interview / timeline | Informational | M | High: big prep sites | Low | `/system-design-mock-interview#session-plan` | Covered |
| STAR method mock interview practice | Informational | M | High | Low–medium | rubric `#behavioral`; later a behavioral page | Later |

### Comparison / alternative

| Query | Intent | Rel. | Competition | Value | Target URL | Priority |
|---|---|---|---|---|---|---|
| pramp alternative(s) | Commercial investigation | M–H | High: G2, FinalRound, SpaceComplexity, many AI-tool listicles | Medium | (proposed) `/compare/peer-mock-interview-platforms` | 60–90 days |
| interviewing.io alternative (free) | Commercial investigation | M | High | Medium | same proposed page | 60–90 days |
| aced / exponent practice alternative | Commercial investigation | M | Medium | Medium | same proposed page | 90 days |

A comparison page must state verifiable facts about each competitor (pricing, matching vs. invite,
features) with a review date, and be honest about where they are stronger (question banks, matching,
paid coaching). Don't publish it until those facts are re-verified.

### Branded

| Query | Intent | Target URL | Status |
|---|---|---|---|
| innerviewhub, innerviewhub.com | Navigational | `/` | Not yet indexed (no results on 2026-10-09). `WebSite.name` = InnerViewHub. |
| innerviewhub login / sign in | Navigational | `/login` | Indexable, own canonical. |
| innerviewhub sign up | Navigational | `/signup` | Indexable, own canonical. |
| innerview mock interview | Navigational (old name) | `/` | `alternateName: InnerView`. Competes with unrelated "InnerView" brands; don't rely on it. |

### Local / country-specific

No country targeting is justified. The product is English-only, remote, and the codebase contains no
market or locale logic. Revisit if Search Console shows traffic concentrated in a country (then
consider localized content, never thin doorway pages per city/country).

## Takeaways

1. **Head terms** ("mock technical interview", "mock coding interview") are dominated by funded
   brands with large link profiles. A new domain with no links shouldn't expect page-one positions there
   in 90 days. Target them through the homepage over the long term.
2. **The realistic first wins are intent-specific long tails where InnerViewHub's actual model is the
   answer**: practicing *with someone you choose*, *system design with a shared whiteboard*, and
   *feedback rubrics*. Competing pages there are blogs without tools, or tools without guidance.
3. **The rubric is the most link-worthy asset**: concrete, product-backed, and missing from the top
   "mock interview with a friend" guides.
