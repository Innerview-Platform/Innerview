# InnerViewHub — initial SEO audit

Two baselines, both measured on production (`https://innerviewhub.com`):

- **Baseline B**: the start of the ranking-strategy phase, after the first technical batch. This is
  the starting point for the 90-day roadmap.
- **Baseline A**: the original state, before any SEO work (kept below for reference).

## Baseline B — start of the ranking phase (2026-10-09)

### Product (from the code, not marketing)

InnerViewHub is a peer-to-peer mock interview room for software engineers. **You invite the person who
interviews you** (no matching with strangers). Four interview types (problem solving, system design,
technical, HR/behavioral) open with different tools: a shared editor with live cursors and code
execution (12 runtimes in production), a shared whiteboard, video (LiveKit, not recorded), private
interviewer notes, chat, read-only observers, a lobby, code replay, and own problems with sample and
hidden test cases. Every interview ends in a type-specific 5-criterion scorecard plus a 6-step hire
signal, and the candidate rates the interviewer back. Free (no billing code). English only; no country
targeting. Conversion goal: sign-up → room created → partner invited. Production usage today: 14
users, 39 interviews, 11 feedback submissions (all within the last 30 days).

Stack: React 19 + Vite 8 SPA (react-router 7), Spring Boot 3.5 API, Fastify (whiteboard sync),
Hocuspocus (editor sync), LiveKit, MySQL/Redis/DynamoDB; nginx in the frontend container behind Caddy
(TLS, edge headers); Docker Compose on one VPS; deploys by `docker compose up -d --build`. No analytics,
no Search Console, no SEO tooling beyond what the previous batch added.

### State

| Area | Finding | Severity |
|---|---|---|
| Indexing | No pages of innerviewhub.com in search results, not even for `site:innerviewhub.com` or the brand name (web search tool, US index, 2026-10-09; Google itself not checked, since Search Console isn't set up). | Critical (external: needs Search Console + time) |
| Brand | Site name and UI said **InnerView**, a name shared by unrelated products (innerview.org, an AI user-research tool, an Ohio service-learning platform). The owner's brand is **InnerViewHub**. | High |
| Content | **One** substantive public page (the landing page). Nothing targets system design, coding practice, running a mock with a friend, or feedback rubrics, though the product covers all of them. | High |
| Rendering | Client-side rendered. Mobile LCP **2.65 s** (target ≤ 2.5 s); **74% of LCP is render delay** (waiting for JS to download and render). Crawlers that don't run JS see no content. | High |
| Structured data | Organization/WebSite/WebPage on `/` only; no BreadcrumbList, no Article; sitemap had no `lastmod`. | Medium |
| Trust | No Privacy Policy, Terms, About/Contact. | Medium (blocked on owner) |
| Measurement | No analytics; conversions only visible in the database. | Medium |
| Off-page | No known backlinks or profiles pointing to innerviewhub.com. The public GitHub repo (github.com/engHazem/Innerview) doesn't link to the site in search results. | Medium |
| Technical foundation | HTTPS/redirects/canonicals/robots/sitemap/404s/noindex/compression/security headers in place; 50/50 production checks passing. | OK |

### Measurements (Lighthouse 12, lab, run on the server, median of 3, `/` signed out)

| | Perf | A11y | Best pr. | SEO | FCP | LCP | TBT | CLS |
|---|---|---|---|---|---|---|---|---|
| Mobile | 92 | 100 | 100 | 100 | 2.05 s | 2.65 s | 167 ms | 0 |
| Desktop | 100 | 100 | 100 | 100 | 0.46 s | 0.54 s | 0 ms | 0 |

Field data (CrUX/INP): none. The site has too little traffic, and Search Console isn't connected.

### Priorities from Baseline B

1. Brand consistency (InnerViewHub) in metadata, UI and social image.
2. Prerender public pages (content in HTML; remove the render delay from LCP).
3. Publish intent-matched pages for the realistic long tails: system design and coding mocks with a
   peer, running a mock with a friend, feedback rubric.
4. Breadcrumb/Article structured data, real `lastmod`.
5. Search Console, measurement, trust pages and legitimate authority building (owner actions).

## Baseline A — before any SEO work (2026-10-09, morning)

Production: `https://innerviewhub.com` (canonical). `https://www.innerviewhub.com`, `http://…` and
`https://187.124.30.226` redirect to it. This is the state **before** any SEO changes; see
[IMPLEMENTATION_REPORT.md](IMPLEMENTATION_REPORT.md) for what changed.

### Architecture

| Item | Finding |
|---|---|
| Framework | React 19 + TypeScript SPA built with **Vite 8**, routed by **react-router 7** (`createBrowserRouter`). No SSR, no prerendering. |
| Serving | Caddy (TLS, edge) → nginx in the `frontend` container (static files + reverse proxy to Spring Boot, canvas, editor). |
| Rendering | `index.html` contains an empty `<div id="root">`. All content is rendered client-side, after `AuthBootstrap` has tried `POST /api/auth/refresh`. |
| Metadata | One static `<title>InnerView</title>` and one generic `<meta name="description">` for every URL. `useDocumentTitle()` changes `document.title` at runtime only. |
| Purpose / audience | Peer-to-peer mock interview platform for software engineers: problem-solving (coding), system design, technical and HR/behavioral rounds; built-in video, shared runnable code editor, whiteboard, private interviewer notes, chat, structured feedback with a hire signal (from `LandingPage.tsx`, `README.md`). |

#### Public vs private routes (from `src/app/router.tsx`)

| Route | Access | Should be indexed? |
|---|---|---|
| `/` | Landing page when signed out (dashboard when signed in) | **Yes**, the main page |
| `/login`, `/signup` | Guest only | Yes (brand navigation queries), but not in the sitemap |
| `/forgot-password`, `/reset-password` | Guest / token link | No |
| `/interviews…`, `/feedback`, `/problems…`, `/settings/profile`, `/u/:username`, `/join` | `ProtectedRoute` (sign-in required) | No |
| `/:code` (room, e.g. `/abc-defg-hij`) | `ProtectedRoute` | No |
| `/dashboard`, `/register`, `/profile`, `/settings`, `/room/join[/:id]` | Legacy, client-side `<Navigate>` | No (should be real redirects) |
| anything else | Client-rendered "Page not found" | No (must return 404) |

### Findings

Severity: **Critical** blocks correct crawling/indexing · **High** large ranking/CTR or UX impact · **Medium** · **Low**.

| # | Severity | Finding | Affected | Evidence | Recommended fix |
|---|---|---|---|---|---|
| 1 | Critical | `/robots.txt` returns the SPA's HTML (`200 text/html`). Lighthouse: "robots.txt is not valid — 51 errors". | site-wide | `curl -I /robots.txt` → `text/html`, 3015 B | Serve a real `robots.txt` with the sitemap URL. |
| 2 | Critical | No sitemap: `/sitemap.xml` returns the SPA's HTML with 200. | site-wide | same | Generate `sitemap.xml` at build time from a single list of public pages. |
| 3 | Critical | Soft 404s: **every** path returns `200` + the same HTML (`/totally-missing-page`, typos, old URLs). | all unknown URLs | `curl` baseline | Return HTTP 404 for paths the router doesn't know, still rendering the SPA's 404 page. |
| 4 | High | Private app routes (`/interviews`, `/problems`, `/u/…`, room codes) return 200 with the landing page's metadata and no `noindex`. Data is protected by the API (JWT) — nothing private leaks — but these URLs can be indexed as duplicates of the home page. | private routes | no `X-Robots-Tag`, no meta robots | `X-Robots-Tag: noindex` on private routes and API/proxy paths. |
| 5 | High | No canonical URL anywhere. | all | `<head>` | Self-referencing canonical on indexable pages (absolute, `https://innerviewhub.com`). |
| 6 | High | Same `<title>InnerView</title>` and description in the initial HTML for every URL; the landing title is set only by JS. Social crawlers (no JS) see "InnerView". | all | `<head>` | Per-page title/description in the **initial HTML** of each public page; keep runtime titles identical. |
| 7 | High | No Open Graph / Twitter metadata, no social image. Shared links show no preview. | all | `<head>` | `og:*`, `twitter:card`, absolute 1200×630 image. |
| 8 | High | No text compression reaches browsers: nginx gzip is on, but `gzip_proxied` defaults to `off` and every request comes through Caddy (`Via` header). Lighthouse: "Enable text compression — est. savings 414 KiB". | all JS/CSS/HTML/JSON | `content-encoding` absent | `gzip_proxied any` (or compress at the edge). |
| 9 | High | Mobile performance 65: LCP 5.6 s, FCP 5.4 s (Lighthouse mobile, simulated throttling). Render-blocking: Google Fonts CSS (~790 ms, 2 extra origins) and app CSS (~750 ms). | `/` | Lighthouse | Compression, self-hosted fonts, don't block the landing on the refresh call. |
| 10 | Medium | Anonymous visitors wait for `POST /api/auth/refresh` (401) before anything renders; the 401 is also logged as a console error (Best Practices). | `/` and all routes | `AuthBootstrap.tsx`, Lighthouse | Skip the refresh when this browser has never had a session. |
| 11 | Medium | No structured data. | `/` | `<head>` | `Organization`, `WebSite`, `WebPage` JSON-LD (no invented ratings/prices/addresses). |
| 12 | Medium | No security headers on HTML/static/canvas responses (no HSTS, `nosniff`, framing protection, referrer policy). The Spring API already sends HSTS, `nosniff`, `X-Frame-Options: DENY`. | all non-API | `curl -I /` | Edge headers in Caddy, set only when the upstream hasn't set them. Helmet does not apply: no Express backend (Spring Boot, Fastify, Hocuspocus). |
| 13 | Medium | Legacy URLs (`/dashboard`, `/register`, `/profile`, `/settings`, `/room/join`) answer 200 then redirect in JS. | legacy | router | Real `301` redirects in nginx. |
| 14 | Medium | Unhashed static files (`favicon.svg`, Excalidraw fonts) are served `immutable` for 1 year; HTML has no `Cache-Control`. | static | headers | Immutable only for hashed `/assets/`; `no-cache` for HTML. |
| 15 | Low | Colour contrast 2.38:1 on the dimmed "off" tiles in the Interview types demo (light theme). | `/` | Lighthouse a11y | Use the full muted colour. |
| 16 | Low | `/favicon.ico` → 404; no `apple-touch-icon`; no raster logo for `Organization.logo`. | site-wide | curl | Add PNG/ICO icons generated from the existing logo. |
| 17 | Low | `Server: nginx/1.27.5` version disclosed. | all | headers | `server_tokens off`. |
| 18 | Info | No Privacy Policy / Terms pages, though the site collects accounts, resumes and uses Google sign-in (Google's OAuth consent screen requires a privacy-policy URL for production). | — | router | Owner must provide the legal text; not generated here. |
| 19 | Info | Only one substantive public page. Organic reach is limited by content, not by technical issues, once 1–8 are fixed. | — | — | See the keyword map and 30–90 day plan. |

### Baseline measurements

Lighthouse 12, run from the server against production, `https://innerviewhub.com/` (signed out):

| | Performance | Accessibility | Best practices | SEO | FCP | LCP | TBT | CLS |
|---|---|---|---|---|---|---|---|---|
| Mobile (simulated 4G) | 65 | 96 | 96 | 91 | 5.4 s | 5.6 s | 0 ms | 0 |
| Desktop | 96 | 96 | 96 | 91 | 1.1 s | 1.1 s | 60 ms | 0.006 |

Transferred on first load: ~700 KiB (uncompressed). Entry chunk `index-*.js` 260 KB, CSS 66 KB.

### What was verified working

- HTTPS with valid Let's Encrypt certificates for the apex and `www`; HTTP → HTTPS (308), `www` →
  apex (301), path and query preserved; the IP redirects to the domain.
- Landing page has one `<h1>`, a logical `h2`/`h3` hierarchy, a skip link, `lang="en"`, a viewport tag,
  and no images (all visuals are CSS/SVG/DOM), so no alt-text or image-weight issues.
- No source maps and no secrets in the production bundle (checked `dist/assets`).
- Private data is protected by the API (JWT); SEO directives are not the access control.
