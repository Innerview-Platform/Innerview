# SEO roadmap — 90 days from 2026-10-09

Goal: maximise the chance of page-one positions for **achievable, relevant** queries (the long tails in
[KEYWORD_URL_MAP.md](KEYWORD_URL_MAP.md)), and turn that traffic into sign-ups and interviews. No ranking
is guaranteed. A new domain with no links usually needs months to rank for anything competitive, so
the plan front-loads indexing, measurement and link-worthy assets.

Owner key: **[you]** needs your accounts/decisions · **[dev]** code change in this repo.

## Days 0–30: get indexed, measured and trusted

| # | Task | Owner | Done when |
|---|---|---|---|
| 1 | **Search Console Domain property**, verified by DNS TXT (steps below) | [you] | Property shows "Ownership verified" |
| 2 | Submit `https://innerviewhub.com/sitemap.xml`; URL-inspect and **request indexing** for `/` and the 4 content pages | [you] | Sitemap "Success, 5 discovered"; inspections show "URL is on Google" over the following days |
| 3 | Google OAuth: add `https://innerviewhub.com/login/oauth2/code/google` | [you] | Google sign-in works on the domain |
| 4 | Privacy Policy + Terms (+ short About/Contact) with real legal text; add to `PUBLIC_PAGES` and the footer | [you] text, [dev] pages | Pages live, linked from the footer |
| 5 | Choose analytics. Recommended: a privacy-friendly, cookieless tool (e.g. Plausible or self-hosted Umami) so no consent banner is needed; GA4 also works. Track the **sign-up** and **room created** events. | [you] account, [dev] snippet + CSP check | Events visible for a week |
| 6 | Bing Webmaster Tools: import from Search Console (also feeds DuckDuckGo/Yahoo) | [you] | Sitemap submitted |
| 7 | Legitimate profiles that link to the site: GitHub repo "Website" field + README link, LinkedIn page for InnerViewHub, your own LinkedIn/X bio | [you] | Links live |
| 8 | Publish **E5** behavioral practice page (editorial plan) | [dev] | Live, in sitemap, checks green |
| 9 | Weekly: Search Console → Pages report; fix anything "Excluded" that should be indexed | [you] | Weekly 10-minute check |

## Days 31–60: earn the first links and impressions

| # | Task | Owner |
|---|---|---|
| 10 | Share the **feedback rubric** (most link-worthy page) where it genuinely helps: answers on r/cscareerquestions / r/leetcode / relevant Discords when someone asks how to practice with a friend, dev.to / Hashnode write-up on "how we built a mock interview scorecard" with a link back. No mass-posting, no link drops. | [you] |
| 11 | Reach out to 5–10 maintainers of curated lists (e.g. GitHub "awesome interview prep" lists, university career-centre resource pages, bootcamp student handbooks) suggesting the rubric or the room, **only where it fits their list's criteria** | [you] |
| 12 | Publish **E6** "How to be a good mock interviewer" | [dev] |
| 13 | First Search Console review (see measurement plan): queries with impressions on pages 2–3 → improve those sections, titles, descriptions | [you] + [dev] |
| 14 | Performance: re-measure; if field data appears, check INP/LCP in Core Web Vitals report | [dev] |

## Days 61–90: compound

| # | Task | Owner |
|---|---|---|
| 15 | **E7** comparison of peer mock interview options, facts re-verified with a "verified on" date | [dev] + [you] review |
| 16 | **E8** one or two system design prompt deep dives, only if `/system-design-mock-interview` earns impressions | [dev] |
| 17 | Rewrite titles/descriptions of pages with high impressions and CTR below the site average | [dev] |
| 18 | Original data, once there are enough interviews: e.g. anonymised, aggregate "which criteria improve fastest across sessions" from the scorecards. Only with user consent in the privacy policy and enough data to be meaningful. A genuine link magnet. | [you] decision, [dev] |
| 19 | Review the keyword map against real query data; drop or merge pages that get nothing after 60+ days indexed | [you] + [dev] |

Explicitly **not** in the plan: buying links, link exchanges, PBNs, automated outreach, mass AI
articles, per-city or per-company doorway pages.

## Search Console procedures

**Verify (DNS TXT):** Search Console → Add property → **Domain** → `innerviewhub.com` → copy the
`google-site-verification=…` value → Spaceship → domain → DNS records → **Add record**: type `TXT`, host
`@`, value as copied, TTL default → wait until `dig +short TXT innerviewhub.com @1.1.1.1` shows it →
**Verify**. Keep the record forever. Don't touch the existing A/CNAME records.

**Submit the sitemap:** Indexing → Sitemaps → `sitemap.xml` → Submit. Expect 5 URLs. Resubmitting
isn't needed after changes; `lastmod` tells Google which pages changed.

**Inspect important URLs:** URL inspection → paste the URL → *Test live URL* → check "Page can be
indexed", the screenshot shows the real page, user-declared canonical = the URL itself → *Request
indexing*. Do it for `/`, the 4 content pages, and again after significant content changes.

**Monitor indexing and crawl issues:** Indexing → Pages: "Why pages aren't indexed". Expected and fine:
private routes ("Excluded by 'noindex' tag"), redirects, 404s. Not fine: any sitemap URL listed there.
Settings → Crawl stats: watch for 5xx spikes.

**Queries, impressions, clicks, position:** Performance → Search results, last 28 days, compare to
the previous period.

- **High impressions, low CTR**: sort by Impressions and add a CTR filter below the site average.
  Improve the title/description (in `src/seo/site.ts`) to match the query wording, without stuffing.
- **Close to page one**: filter Position > 8 and < 20. Strengthen those sections: answer the query
  more directly, add internal links to that page with descriptive anchors.
- **Declining pages**: compare the last 28 days with the previous 28 per page. Check for content
  that's outdated or a competitor's better answer.
- **Content gaps**: queries with impressions where no page answers the question → new section or (if
  it's a distinct intent) a new page added to the keyword map first.

## Measurement plan

Record these on day 0 (values below), then every 2 weeks in a simple spreadsheet:

| Metric | Source | Baseline (2026-10-09) |
|---|---|---|
| Indexed pages (of 5 in sitemap) | Search Console → Pages | 0 known (not in search results; GSC not set up) |
| Impressions / clicks / avg. position / CTR, per page and per query | Search Console → Performance | none yet |
| Branded query "innerviewhub" position | Search Console → Performance | not ranking |
| Target long-tail positions (table in the keyword map) | Search Console → Performance (filter by query) | not ranking |
| Referring domains | Search Console → Links (top linking sites) | 0 known |
| Core Web Vitals (field) | Search Console → Core Web Vitals | no data |
| Lighthouse lab, mobile `/` (median of 3) | `tests/seo/docker` + Lighthouse | see IMPLEMENTATION_REPORT |
| Sign-ups | DB: `select count(*) from users where created_at >= …` (until analytics exists) | 14 total, 14 in last 30 days |
| Interviews created | DB: `interviews` | 39 total, 39 in last 30 days |
| Feedback submitted | DB: `feedback` | 11 |
| Organic sign-ups (needs analytics) | Analytics: sign-up event, source = organic search | not measurable yet |

Judge progress by trends over 4–8 weeks, not single days. Rankings move slowly for a new domain;
indexed pages and impressions on the long tails are the leading indicators in the first 60 days.
