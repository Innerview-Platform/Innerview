# Content gap analysis and editorial plan — InnerViewHub (2026-10-09)

Built from [KEYWORD_RESEARCH.md](KEYWORD_RESEARCH.md) and [COMPETITOR_ANALYSIS.md](COMPETITOR_ANALYSIS.md).
"Gap" means: searchers need it, the pages ranking today don't provide it well, and InnerViewHub can
provide it truthfully.

## Gaps found

| # | Gap | Evidence | InnerViewHub's answer | Status |
|---|---|---|---|---|
| G1 | Guides on mock interviews **with a friend** don't give a scorecard. They say "give three concrete things" but no criteria per round. | Codex Interview playbook (~1,450 words): no rubric, no system design specifics. GetMockInterview system design article: "no explicit rubric". | The product's real scorecards (5 criteria × 4 round types + interviewer rating + 6-step hire signal) with original 1–5 anchors and "sounds like a 2 / 5" examples. | **Published**: `/mock-interview-feedback-rubric` |
| G2 | No single page connects **how to run** a friend mock with **timings per round** (coding, system design, technical, behavioral) and a hint policy. | Top results give one generic timeline (25+5 min, or 45 min) and skip behavioral or design. | Per-round timing table, ground rules, hint ladder, interviewer script, evidence-based feedback, mistakes table. | **Published**: `/mock-interview-with-a-friend` |
| G3 | System design practice pages are either **solo whiteboards** (SystemDesignBoard, onlinewhiteboard.org), **paid/AI products**, or **articles without a tool**. Few pages serve "practice system design *with a person*". | SERP for "system design mock interview practice with a friend": Medium posts, Educative, Codemia (AI/solo), Design Gurus. | Whiteboard + video + prompt + design scorecard in one room, plus a 60-minute plan and prompts with deep-dive hooks. | **Published**: `/system-design-mock-interview` |
| G4 | Shared-editor tools for coding mocks (CodeBunk, CodeInterview, Playcode) are **built for hiring** or generic pair coding. None pairs the editor with **hidden-test judging + a mock-interview scorecard + guidance**. | Tool homepages (titles/H1s in competitor analysis). | Runnable shared editor, own problems with sample/hidden tests and verdicts, 45-minute plan, coding scorecard. | **Published**: `/mock-coding-interview` |
| G5 | Rendering: several niche competitors ship **client-rendered** pages (SystemDesignBoard 6 KB HTML; GetMockInterview's article has no `<title>` in its initial HTML). | `curl` of their pages. | All InnerViewHub public pages are prerendered (23–52 KB HTML with full text). | **Done** |
| G6 | Behavioral practice for engineers: content is either generic (STAR explainers) or AI tools. | SERP "behavioral mock interview practice software engineer STAR peer". | Behavioral scorecard exists (structure, impact, self-awareness, motivation). | Partly covered in the rubric; dedicated page **planned** (E5). |
| G7 | **Interviewer-side** content (how to be a good mock interviewer, how to give hints, rating the interviewer) is thin everywhere; most content addresses candidates only. | Few results address the interviewer; Aced/Practick mention "interviewer guides" only as a feature. | The product rates interviewers (clarity, helpfulness, professionalism) and has private interviewer notes. | Covered in E2/E3; dedicated guide **planned** (E6). |
| G8 | Honest **comparisons** of free peer-practice options after Pramp moved into Exponent/Aced. Existing lists are dominated by AI-tool vendors promoting themselves. | "Pramp alternative 2026" SERP: FinalRound AI, InstantInterview, Edesy… | A fact-checked comparison that is clear about trade-offs (InnerViewHub = bring your own partner, no matching). | **Planned** (E7), only after facts are re-verified. |
| G9 | **Trust pages** missing: Privacy Policy, Terms, About/Contact. | Site audit. Google OAuth production verification needs a privacy policy URL. | Owner must supply the legal text. | **Blocked on owner** |

## What was deliberately not created

- **Per-company pages** ("Google mock interview", "Meta system design mock"): InnerViewHub has no
  company-specific content or interviewers. They would be doorway pages.
- **Per-language pages** ("Python mock interview", "Java mock interview", …): the room is the same for
  every language, so the pages would be near-duplicates.
- **AI interview pages**: the copilot isn't available.
- **Question-bank pages**: the problem library is empty in production; listing problems would mislead.

## Editorial plan

Conversion goal for every page: **create an account → create a room → invite a partner** (measured
by sign-ups and rooms created; see the measurement plan in the roadmap). Each page links to related pages and to `/signup`
(header and closing call to action); `tests/seo/dist.check.mjs` verifies every sitemap page is linked from
at least two other pages and every internal link resolves.

| ID | Page | Target query cluster | Audience | Intent | Outline | Internal links | Status |
|---|---|---|---|---|---|---|---|
| E1 | `/system-design-mock-interview` | system design mock interview (with a friend/peer), system design whiteboard | Mid/senior engineers before design rounds | Commercial + how-to | Room features → 60-min plan → design scorecard (from product) → 6 prompts with deep-dive hooks → interviewer tips → FAQ → CTA | rubric, guide, coding page, home | Published 2026-10-09 |
| E2 | `/mock-coding-interview` | mock coding interview with a friend, coding interview practice with a peer | Engineers before coding rounds | Commercial + how-to | Room features (runnable editor, hidden tests) → 45-min plan + hint policy → coding scorecard → starter practice set → interviewer tips → FAQ → CTA | rubric, guide, system design, home | Published 2026-10-09 |
| E3 | `/mock-interview-with-a-friend` | how to run a mock interview with a friend; mock interview tips for interviewer; friend goes easy | Candidates and their practice partners | Informational | Why friend mocks fail → before → timing per round → interviewer script + hint ladder → feedback method → after → mistakes → tools | rubric, coding, system design, signup | Published 2026-10-09 (Article) |
| E4 | `/mock-interview-feedback-rubric` | mock interview feedback rubric/template; system design rubric; hire signal | Interviewers, bootcamps, study groups | Informational / template | 1–5 anchors → 4 scorecards with "sounds like 2/5" → hire signal → rating the interviewer → copyable template → how to use | guide, coding, system design, signup | Published 2026-10-09 (Article) |
| E5 | `/behavioral-interview-practice` | behavioral mock interview software engineer; STAR practice with a friend | Engineers before HR/behavioral rounds | Commercial + how-to | What the HR room is (video, conversation) → building a story bank → 25-min plan → behavioral scorecard → question set mapped to criteria → common failure modes | rubric `#behavioral`, guide, home | Planned (days 15–30) |
| E6 | `/how-to-be-a-good-mock-interviewer` | how to be a good mock interviewer; mock interviewer tips | People who interview friends/peers | Informational | Picking questions → staying neutral → hint ladder → timestamped notes → delivering feedback → being rated back | guide, rubric, coding, system design | Planned (days 30–60) |
| E7 | `/compare/peer-mock-interview-platforms` | pramp alternative, free peer mock interview platforms | Candidates choosing a tool | Commercial investigation | Criteria (matching vs invite, cost, tools, feedback) → fact-checked table with "verified on" date → when each is the better choice → where InnerViewHub fits | home, guide | Planned (days 60–90), facts re-verified first |
| E8 | System design prompt deep dives (2–3, e.g. rate limiter, notification service) | "design a rate limiter interview" | Design-round candidates | Informational | Requirements questions → reference high-level design → deep-dive branches → how the scorecard applies | system design page, rubric | Planned (days 60–90), only if E1 earns impressions |

Writing standard for every new page: original text written from the product and real practice
experience; product claims verified in code before publishing (the rubric is checked automatically by
`tests/seo/content.check.mjs`); a visible "Updated" date that changes only when the content does; no
fabricated statistics, testimonials or company affiliations.
