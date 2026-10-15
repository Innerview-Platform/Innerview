# Competitor analysis — InnerViewHub (2026-10-09)

Competitors are the pages that **actually appeared** for the target queries in
[KEYWORD_RESEARCH.md](KEYWORD_RESEARCH.md) (web search tool, US index, not Google; 2026-10-09), not a
list from memory. Facts were taken from the pages themselves (fetched on the same day) unless marked
*reported*, meaning they came from third-party pages in the results and weren't verified on the
competitor's own site. Nothing here is copied into InnerViewHub's content.

## Who competes for what

| Competitor | Type | Competes on | How partners are found | Price (as stated) |
|---|---|---|---|---|
| **Aced (formerly Exponent)**, `aced.io/practice` | Prep platform, peer + AI mocks | peer mock interview, system design/coding mock, Pramp alternative | Algorithmic matching by schedule/level; also "Practice with a Friend" | Free credits monthly; paid membership for unlimited |
| **Pramp** | Peer mock platform | pramp alternative (brand) | — | *Reported*: folded into Exponent; since July 2024 new sessions run on Exponent Practice |
| **Practick**, `practick.io` | Free peer mock platform | free peer mock interviews, DSA + system design | Automatic scheduler pairing (Tue/Sun evenings), credit barter | Free |
| **interviewing.io** | Paid mocks with senior engineers, anonymous | mock coding/system design interview | Paid expert interviewers | *Reported*: from ~$179–$339 per session |
| **Hello Interview** | System design prep + paid human mocks | system design mock interview | Paid coaches | Not checked |
| **Codemia**, Educative, Design Gurus | Courses / AI practice | system design mock interview | Solo/AI or paid | Mixed |
| **Codex Interview** (blog) | Interview-assistant product with SEO blog | how to run a mock interview with a friend | n/a (article) | n/a |
| **GetMockInterview** (article) | AI mock interview product | system design mock interview (article) | AI | n/a |
| **CodeBunk, CodeInterview, Playcode** | Collaborative editors (hiring / pair coding) | mock coding interview with a friend tool | Bring your own | Free tiers / paid |
| **SystemDesignBoard, theonsite.dev, onlinewhiteboard.org** | Solo/collab whiteboards | system design whiteboard | n/a | Free / freemium |
| **zero2sudo (Substack), Prepfully, Indeed** | Rubric articles | mock interview feedback rubric | n/a | n/a |

## Page-level analysis (top pages for InnerViewHub's priority intents)

| Page | Title / H1 | Structure & depth | Structured data | Lab performance (mobile, 1 run) | Strengths | Gaps InnerViewHub fills |
|---|---|---|---|---|---|---|
| Aced `/practice` | "Mock Interviews: Improve Your Skills By Practicing with Peers and AI…" / "Practice mock interviews with peers and AI" | ~3,200 words: session schedule, AI practice, how it works, testimonials, 9-question FAQ; company logos, "thousands of candidates" | Organization, WebSite, WebPageElement | Perf 36, LCP 9.4 s, TBT 7.0 s, 4.4 MB | Huge brand, matching, many interview types, social proof | Heavy page; partner-of-your-choice is a side feature; no public scorecard |
| Practick `/` | "Free Mock Interview Practice: DSA & System Design \| Practick" / "Free mock interviews with real people" | ~320 words, 4 H2s | FAQPage | Perf 74, LCP 1.6 s, CLS 0.20 | Free, real people, 600+ questions, matching | Thin page; layout shift; no rubric or session guidance; fixed schedule |
| Codex Interview guide | "How to Run a Mock Interview With a Friend (Playbook)" | ~1,450 words, 9 H2s; 60-min two-way format | BlogPosting, BreadcrumbList, Organization, Person | Perf 85, LCP 3.1 s | Ranks for the exact query; clear format | **No rubric**, no system design specifics, no per-round timings |
| GetMockInterview system design article | (no `<title>` in initial HTML) "System Design Mock Interview: A Complete Preparation Guide" | ~1,450 words; 45–60 min; sample prompts; 3 FAQs | none in initial HTML (client-rendered) | not measured | Broad coverage | **No scoring rubric**; AI CTA only; client-rendered |
| SystemDesignBoard `/` | "SystemDesignBoard — Free System Design Whiteboard for Interviews" | Tool landing, 6 KB initial HTML (client-rendered) | none | Perf 58, LCP 7.6 s | Purpose-built whiteboard | Solo tool: no partner, video or feedback |
| zero2sudo rubric | "zero2sudo's Mock SWE Interview Rubric" | Rubric with 8 dimensions, intern/new-grad focus | NewsArticle, BreadcrumbList, Person | not measured | Concrete rubric | Coding only; no system design/behavioral; not tied to a room |

Performance numbers: Lighthouse 12, mobile preset with applied (DevTools) throttling, one run per
page from the same server as InnerViewHub's own measurements, so indicative only.

## InnerViewHub's position

| | InnerViewHub (after this phase) |
|---|---|
| Unique value | Invite **the partner you choose** into a room built for interviewing (editor that runs code with hidden tests, whiteboard, video, private notes, observers), ending in a **type-specific scorecard both ways**. |
| Content | 4 intent-matched pages (900–1,140 words each) + landing (~900 words), all prerendered |
| Structured data | Organization, WebSite, WebPage, BreadcrumbList, Article |
| Lab performance (mobile, applied throttling, median of 3) | `/` LCP 2.1 s, CLS 0.001; content pages LCP ~1.1 s |
| Weaknesses | **No backlinks and not indexed yet**; brand unknown; no question bank (empty library); no matching (by design); no social proof; no trust pages yet |

## Opportunities (in priority order)

1. **"With someone you choose" long tails**, where the big platforms optimise for matching and the blog
   guides have no tool. → `/mock-interview-with-a-friend`, `/system-design-mock-interview`, `/mock-coding-interview`.
2. **Rubric content.** The top "with a friend" and "system design mock" guides lack scorecards. →
   `/mock-interview-feedback-rubric` is the page to promote for links.
3. **Speed and rendering.** Several niche competitors are client-rendered or heavy; prerendered, fast
   pages are an advantage once indexed (a tie-breaker, not a ranking guarantee).
4. **Interviewer-side content** (being a good mock interviewer, rating the interviewer) is thin
   everywhere (editorial plan E6).
5. **Honest comparison** of free peer-practice options after Pramp's move (E7). Only with
   re-verified facts.

## What not to imitate

- Company logos, "thousands of users" or testimonials: InnerViewHub has none of these to show truthfully.
- FAQPage markup for rich results: Google limits FAQ rich results to authoritative government/health
  sites, so it wouldn't produce a rich result here. The landing page's FAQ is visible content only.
- 600+-question banks: not true for InnerViewHub today.
