# InnerViewHub SEO — implementation report

Phase 2 ("first-page competitor") on 2026-10-09, building on the technical batch from earlier the same
day (Appendix A). Everything marked **live** is deployed to `https://innerviewhub.com` and verified there.
Related: [INITIAL_AUDIT.md](INITIAL_AUDIT.md) · [KEYWORD_RESEARCH.md](KEYWORD_RESEARCH.md) ·
[COMPETITOR_ANALYSIS.md](COMPETITOR_ANALYSIS.md) · [CONTENT_GAP_ANALYSIS.md](CONTENT_GAP_ANALYSIS.md) ·
[KEYWORD_URL_MAP.md](KEYWORD_URL_MAP.md) · [SEO_ROADMAP_90_DAYS.md](SEO_ROADMAP_90_DAYS.md).

No ranking is claimed or promised. The site isn't verified in Search Console or confirmed indexed; those
need the owner's Google account (roadmap tasks 1–2).

## 1. Root causes of the technical SEO problems

| Problem | Root cause |
|---|---|
| Not findable for its own name | Site never submitted/verified; no inbound links; the old name "InnerView" belongs to several other products. |
| Nothing to rank for the target queries | Only the landing page was public; the product's strongest differentiators (rubric, system design room, runnable editor with hidden tests) had no pages. |
| Slow mobile LCP; content invisible without JS | Client-side rendering. After prerendering, three further causes, found in Lighthouse traces: (a) the browser ran ~1 s of module evaluation + hydration **before** the first paint; (b) render-blocking CSS shared bandwidth with ~30 high-priority JS module preloads and font preloads; (c) the hero H1 faded in from `opacity: 0`, so LCP waited for the whole animation. |
| Layout shift once painting got faster | Text painted in local fallback fonts with different metrics, then shifted when the web fonts arrived. |
| (Phase 1, Appendix A) robots/sitemap as HTML, soft 404s, no canonicals, no compression through the proxy, missing headers | See Appendix A. |

## 2. Changes (live)

### Brand: InnerViewHub
- Metadata (`SITE_NAME`, titles " · InnerViewHub", `og:site_name`, WebSite/Organization name; "InnerView"
  kept only as `alternateName`), the logo wordmark (Inner**View**Hub), user-facing strings (footer, auth
  layout, errors, profile, whiteboard name), regenerated `og-image.png`.
  Files: `src/seo/site.ts`, `components/common/Logo.tsx`, `components/layout/AuthLayout.tsx`,
  `components/navigation/Sidebar.tsx`, `lib/apiError.ts`, `features/profile/pages/ProfilePage.tsx`,
  `features/interviews/components/RoomCreatedCard.tsx`, `features/auth/pages/ResetPasswordPage.tsx`,
  `features/room/components/SharedCanvasPanel.tsx`, `features/landing/pages/LandingPage.tsx`, `public/og-image.png`.
  Not changed: backend email templates and the editor's sample `greet('InnerView')` string.

### Prerendering + hydration (Vite, no framework migration)
- `pnpm run build` = type check → client build → SSR build of `src/entry-prerender.tsx` → `scripts/prerender.mjs`.
  The script renders each `prerender: true` page through the **same route table and providers** as the
  browser (`react-dom/static` `prerenderToNodeStream` + react-router static handler), writes its head
  (`src/seo/head.ts`) and body into `<page>/index.html`, preloads the page's own chunk (from the Vite
  manifest, which is then deleted), and writes `app.html`, `robots.txt`, `sitemap.xml`.
- `src/main.tsx`: `hydrateRoot` for first-time visitors (their first render is exactly the prerendered
  signed-out page), **after the first paint** (rAF + timeout); everyone else (session to restore, Google
  sign-in return) renders from scratch as before, with the prerendered markup hidden by a pre-paint
  flag (`index.html`) so it doesn't flash.
- SSR-safety: `lib/theme.ts` (no `window` at import; server snapshots), `lib/toaster.ts` (server
  snapshot), `AuthBootstrap.tsx` (signed-out render when there's no `window`), `app/router.tsx` exports
  `routes` (the browser router is created in `main.tsx`).
- First paint: on prerendered pages the stylesheet is **inlined** and all app JS is fetched with
  `fetchpriority="low"`; the hero H1 uses a transform-only `rise-solid` animation (`styles/index.css`).
- Layout stability: **metric-matched fallback fonts** (`styles/fonts.css`, generated with Capsize) for
  Geist, Geist Mono and Instrument Serif over Arial/Roboto, Courier New/Roboto Mono, Times New
  Roman/Noto Serif (+ metric-compatible Liberation/Croscore fonts on Linux).
- Removed: `frontend/vite-plugin-seo.ts` (logic moved to `src/seo/head.ts` + `scripts/prerender.mjs`).

### New public pages (prerendered, in the sitemap)
| URL | Type | Words in HTML | Schema |
|---|---|---|---|
| `/system-design-mock-interview` | Product landing | ~1,080 | WebPage + BreadcrumbList |
| `/mock-coding-interview` | Product landing | ~900 | WebPage + BreadcrumbList |
| `/mock-interview-with-a-friend` | Guide | ~1,060 | WebPage + BreadcrumbList + Article |
| `/mock-interview-feedback-rubric` | Resource | ~1,140 | WebPage + BreadcrumbList + Article |

Files: `src/features/marketing/pages/*.tsx`, `src/features/marketing/components/MarketingLayout.tsx`
(header, footer, breadcrumbs, text primitives), `src/features/marketing/rubric.ts` (the product's real
scorecards, checked against the backend), routes in `src/app/router.tsx` and `src/routes/paths.ts`,
nginx locations + trailing-slash 301s in `frontend/nginx.conf`. Every product claim on these pages was
checked in the code or database first (e.g. hidden tests and verdicts, observers, replay, no video
recording, no billing → "free"); the empty problem library and 14-user base mean no question-bank or
social-proof claims.

### Landing page
- New title/description: "Peer mock interviews for software engineers". Shared header/footer
  (footer links every public page), contextual links from Interview types and Feedback to the new
  pages, and a factual FAQ (who it's for, no matching, free, languages, not recorded, observers).
  File: `features/landing/pages/LandingPage.tsx`.

### Structured data and sitemap
- JSON-LD on every sitemap page (`src/seo/head.ts`): Organization + WebSite (home), WebPage with
  `dateModified`, BreadcrumbList, Article (author/publisher = InnerViewHub organisation, real dates).
  No ratings, reviews, prices, FAQPage or SoftwareApplication.
- `sitemap.xml` now has 5 URLs with `<lastmod>` taken from each page's `lastModified` in `site.ts`
  (edited by hand when content changes, never the build time).

### Security headers / Helmet
No change in this phase. Helmet still doesn't apply: there is no Express service (Spring Boot, Fastify,
Hocuspocus). Edge headers are set in Caddy, without overriding Spring's (Appendix A). The new inline
`<style>` and inline scripts are compatible with the current minimal CSP (`frame-ancestors`,
`base-uri` only); a future strict CSP must allow them (hash or nonce).

## 3. Tests and measurements

### Automated checks (all run, all passing on 2026-10-09)

| Check | Where | Result |
|---|---|---|
| Type check + client build + SSR build + prerender | `docker compose build frontend` (`pnpm run build`) | pass (existing >900 kB lazy-chunk warning unchanged) |
| `routes.check.mjs`: router ↔ nginx | CI + local | 60/60 pass |
| `content.check.mjs`: rubric = `FeedbackRubric.java`, hire signals = app, page metadata limits, dates, wiring | CI + local | 43/43 pass |
| `dist.check.mjs`: heads, JSON-LD (incl. Breadcrumb/Article), prerendered bodies (1 h1, word counts), inlined CSS, low-priority JS, every internal link resolves, no orphan pages, robots, sitemap + lastmod | CI + local | 159/159 pass |
| `production.check.mjs`: status codes, redirects incl. trailing slash, robots/sitemap, prerendered bodies, internal links, compression, caching, headers | production | 74/74 pass |
| `browser.check.mjs`: hydration without mismatches or console errors on all 5 prerendered pages, interactivity, client-side navigation, returning-visitor path, 404, private-route redirect | preview container **and** production | 26/26 pass |
| API / real-time smoke after deploy | production | canvas 200, collab WebSocket 101, `/ws-signal/info` 200, login API 400 (empty body), LiveKit 200; backend healthy; no nginx errors |

Not run: backend unit tests and `tests/e2e` (no backend code changed in this phase; e2e needs local test
accounts); a signed-in session end to end on production (no test account there).

### Lighthouse (lab data, Lighthouse 12 on the server, mobile unless noted, median of 3)

Two throttling methods, because they disagree on this page shape:
- **Applied** (`--throttling-method=devtools`): real slow-4G network + 4× CPU in the browser; the
  browser's own paint times. Closest to what a slow phone experiences.
- **Simulated** (Lighthouse default, "Lantern"): modelled from an unthrottled trace. It counts every
  request started before LCP, including the low-priority JS the page doesn't need to paint, so it's
  pessimistic here. It's also what PageSpeed Insights shows.

| Page | Method | Perf | FCP | LCP | TBT | CLS |
|---|---|---|---|---|---|---|
| `/` before this phase (Baseline B) | applied | 82 | 2.78 s | 3.64 s | 221 ms | 0 |
| `/` **now** | applied | **92** | 1.98 s | **2.11 s** | 267 ms | **0.001** |
| `/system-design-mock-interview` (new) | applied | 99 | 1.12 s | **1.12 s** | 110 ms | 0.001 |
| `/mock-interview-with-a-friend` (new) | applied | 99 | 1.14 s | **1.14 s** | 129 ms | 0 |
| `/` before this phase (Baseline B) | simulated | 92 | 2.05 s | 2.65 s | 167 ms | 0 |
| `/` **now** | simulated | 88 | **1.32 s** | 2.74 s | 317 ms | 0 |
| `/system-design-mock-interview` | simulated | 92 | 1.24 s | 2.73 s | 235 ms | 0 |
| `/` **now** | desktop | 100 | 0.35 s | 0.59 s | 11 ms | 0 |

Accessibility, Best practices and SEO are **100** on every page and method. The "before" rows with
applied throttling were measured after the prerender went live but before the paint-path fixes (same
landing content); the simulated "before" row is Baseline B.

Honest reading: with applied throttling, every measured page meets the "good" LCP (≤ 2.5 s) and CLS
(≤ 0.1) thresholds. Simulated LCP is still ~2.6–2.7 s. TBT rose because the browser now paints first
and hydrates afterwards; TBT is a lab proxy for INP, which needs field data. The next performance step is
less JS on public pages (roadmap 14). The lab image includes `fonts-liberation` (Arial-compatible
metrics, as on Windows/macOS), so the fallback-font metric overrides apply as they do for real visitors.
**No field data (CrUX/INP) exists yet.**

## 4. Remaining blockers

1. **Not verified/indexed**: Search Console needs the owner's Google account and a DNS TXT record.
2. **No backlinks**: authority has to be earned (roadmap days 31–60). Nothing was acquired here.
3. **No analytics**: organic conversions can't be attributed yet.
4. **Trust pages**: Privacy Policy/Terms need the owner's legal text (also required for Google OAuth).
5. **Google OAuth redirect URI** for the domain (from the domain migration).
6. **Not committed**: all changes are in the working tree of `/opt/innerview`; a `git pull`/reset or a
   deploy from GitHub would revert them.

## 5. Manual tasks

See [SEO_ROADMAP_90_DAYS.md](SEO_ROADMAP_90_DAYS.md) for the step-by-step Search Console procedure
(verify, sitemap, URL inspection, monitoring, CTR and near-page-one analysis), analytics choice, Bing
Webmaster Tools, profiles and the authority plan. Owner decisions also needed: confirm the brand rename
in the logo and UI is wanted (it was applied because the brief names the brand InnerViewHub), and
review the content pages' wording.

## 6. Next 30 / 60 / 90 days and 7. measurement plan

In [SEO_ROADMAP_90_DAYS.md](SEO_ROADMAP_90_DAYS.md): prioritised tasks for each 30-day block, and the
measurement plan with day-0 baselines (indexed pages 0 known; 14 users, 39 interviews, 11 feedback
submissions; Lighthouse numbers above).

## How to change things later

- Titles, descriptions, dates, sitemap membership: `frontend/src/seo/site.ts` (update `lastModified` only
  when the content changes).
- New public page: add it to `PUBLIC_PAGES`, a route in `router.tsx` + `paths.ts`, a module mapping in
  `scripts/prerender.mjs`, a `location =` block in `nginx.conf`. `pnpm run check:seo` tells you what's
  missing.
- Rubric changes: change `FeedbackRubric.java` and `features/marketing/rubric.ts` together.
  `content.check.mjs` fails until they match.

---

## Appendix A — first technical batch (earlier on 2026-10-09)

> Historical record. Since then, `vite-plugin-seo.ts` was replaced by `src/seo/head.ts` + `scripts/prerender.mjs`,
> the brand in metadata changed from InnerView to InnerViewHub, and the measurements below were superseded by section 3.

### Fixes by audit finding

| # | Finding | Fix | Files |
|---|---|---|---|
| 1 | robots.txt was HTML | Generated `robots.txt`: allows the site, disallows `/api/`, `/actuator/`, `/oauth2/`, `/login/oauth2/`, lists the sitemap. Private pages are **not** disallowed, so crawlers can see their `noindex`. | `frontend/vite-plugin-seo.ts` |
| 2 | No sitemap | Generated `sitemap.xml` with the `sitemap: true` pages from `site.ts` (currently `/`). No `lastmod`: the build time isn't a content date. | same |
| 3 | Soft 404s | nginx serves known routes only. Any other path returns **404** with the SPA's "Page not found" page. The router now checks the room-code shape before sign-in, so signed-out visitors also see "Page not found" (they used to see the sign-in form). Missing assets stay plain 404s. | `frontend/nginx.conf`, `frontend/src/app/router.tsx` |
| 4 | Private routes indexable | Signed-in routes, room codes, `/join`, `/forgot-password`, `/reset-password`: `app.html` with `<meta name="robots" content="noindex">` **and** `X-Robots-Tag: noindex, nofollow`. API, actuator, OAuth and canvas responses also send `X-Robots-Tag`. Access control is unchanged (the API's JWT checks). | `nginx.conf`, `vite-plugin-seo.ts` |
| 5 | No canonical | Absolute self-canonical on `/`, `/login`, `/signup`; none on the noindex shell. | `vite-plugin-seo.ts` |
| 6 | Same title/description everywhere | Per-page title and description in the initial HTML; runtime titles use the same strings (`pageTitle()`). | `src/seo/site.ts`, `index.html`, `useDocumentTitle.ts`, Landing/Login/Register pages |
| 7 | No social metadata | `og:*` (with image size and alt), `twitter:card=summary_large_image`, absolute URLs. New 1200×630 `og-image.png` rendered from the real logo, fonts and colours (source: `docs/seo/og-image.html`). | `public/og-image.png` |
| 8 | No compression | `gzip_proxied any` + `gzip_vary on` (nginx skipped compression for every request because Caddy adds `Via`). Entry JS now gzip. | `nginx.conf` |
| 9 | Slow mobile LCP | Compression; Google Fonts **self-hosted** (same files and `unicode-range` subsets, Vite-hashed, immutable caching; removes two third-party origins from the critical path); preload of the 3 first-screen font files. | `src/styles/fonts.css`, `src/assets/fonts/*`, `index.css`, `index.html` |
| 10 | Landing waited on a 401 refresh call | A `innerview.hasSession` hint is set when a session is saved and cleared on sign-out/expiry. Browsers that never had a session render immediately, with no refresh call and no console 401. Returning users, Google sign-in returns and pre-existing sessions still refresh first, as before. | `session.ts`, `AuthBootstrap.tsx` |
| 11 | No structured data | Home page JSON-LD `@graph`: `Organization` (name InnerView, alternateName InnerViewHub, logo), `WebSite`, `WebPage`. No ratings, reviews, prices, addresses or `SoftwareApplication` (it would need `offers`/ratings we can't state). | `vite-plugin-seo.ts`, `public/icon-512.png` |
| 12 | No security headers on HTML/static | Caddy `(security-headers)` snippet on the apex and `www`: HSTS (1 year, includeSubDomains, **no preload**), `nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (camera/mic/screen share for the site itself, geolocation/payment/usb off), CSP `frame-ancestors 'self'; base-uri 'self'`. Each is set with `?`, i.e. only if the upstream didn't, so Spring Security's API headers (`X-Frame-Options: DENY` etc.) are kept, with no duplicates. | `infrastructure/caddy/Caddyfile` |
| 13 | Legacy URLs 200 + JS redirect | nginx `301`s with the query string kept: `/dashboard`→`/`, `/register`→`/signup`, `/profile` and `/settings`→`/settings/profile`, `/room/join`→`/join`. Relative `Location` (`absolute_redirect off`) so nginx never emits `http://localhost/…`. | `nginx.conf` |
| 14 | Caching | `/assets/*` (hashed) `immutable` 1 year; HTML `no-cache`; unhashed files (favicon, icons, og-image, Excalidraw fonts) 7 days; robots/sitemap 1 hour. | `nginx.conf` |
| 15 | Contrast 2.38:1 | Dimmed tiles in the Interview types demo use the full muted colour (dashed border and icon still mark them "off"). | `LandingPage.tsx` |
| 16 | No favicon.ico / touch icon | `favicon.ico` (48×48), `apple-touch-icon.png` (180×180), `icon-512.png`, rendered from the existing SVG mark. | `public/`, `index.html` |
| 17 | nginx version disclosed | `server_tokens off`. | `nginx.conf` |

Also: `VITE_SITE_URL` build arg (from `PUBLIC_HOST` in `docker-compose.prod.yml`, default
`https://innerviewhub.com`) sets the origin for canonicals, OG, robots and sitemap.

#### Helmet

**Not used.** Helmet is Express middleware, and no service here runs Express:

- the backend is **Spring Boot**, and Spring Security already sends HSTS, `nosniff`, `X-Frame-Options: DENY`
  and no-store caching on API responses;
- the whiteboard sync server is **Fastify**;
- the editor is **Hocuspocus**.

The responses that lacked headers were the HTML/static files from nginx and canvas uploads. The edge
(Caddy) covers every response in one place, and its default-only (`?`) mode avoids conflicting policies.
A full `script-src`/`style-src` CSP was **not** enforced, because Excalidraw (embeds YouTube/Vimeo/Figma,
loads libraries from excalidraw.com) and LiveKit would need testing in a real call first. Security
headers don't affect rankings; they're hardening.

#### Changed files

`frontend/`: `index.html`, `nginx.conf`, `vite.config.ts`, **`vite-plugin-seo.ts`** (new), `Dockerfile`,
`package.json` (`check:seo`), `tsconfig.json`, `src/seo/site.ts` (new), `src/styles/fonts.css` (new),
`src/assets/fonts/*.woff2` (new, 15 files, 244 KB, SIL OFL), `src/styles/index.css`, `src/vite-env.d.ts`,
`src/hooks/useDocumentTitle.ts`, `src/app/router.tsx`, `src/features/auth/{components/AuthBootstrap.tsx,utils/session.ts,pages/LoginPage.tsx,pages/RegisterPage.tsx}`,
`src/features/landing/pages/LandingPage.tsx`, `public/{og-image.png,icon-512.png,apple-touch-icon.png,favicon.ico}` (new).
Root: `infrastructure/caddy/Caddyfile`, `docker-compose.prod.yml`, `.github/workflows/ci.yml` (new
`frontend` job), `docs/DEPLOYMENT.md`, `tests/seo/*` (new), `docs/seo/*` (new).
Backup of the pre-change Caddyfile: `/root/innerview-backups/`.

### Validation

| Check | Command | Result |
|---|---|---|
| Type check + production build | `docker compose build frontend` (runs `tsc --noEmit && vite build`) | Pass. The existing >900 kB chunk warning is unchanged (lazy room/whiteboard chunks, byte-identical to before). |
| Router ↔ nginx consistency | `node tests/seo/routes.check.mjs` | 52/52 pass. It caught that `/signup` also matches the 6-character room-code pattern; nginx's exact match wins, and the test now models that. |
| Build output | `node tests/seo/dist.check.mjs dist` | 53/53 pass |
| Live production | `node tests/seo/production.check.mjs` (with `IP=187.124.30.226`) | 50/50 pass |
| nginx config | `docker exec innerview-frontend nginx -t` | ok |
| Caddy config | `caddy validate` before `caddy reload` | valid |
| Rendered pages (headless Chromium) | `/`, `/login`, `/signup` show their content and titles; `/interviews`, `/abc-defg-hij` → sign-in; `/nope-not-here`, `/interviews/1/2/3` → "Page not found" | as expected |
| Real-time & auth endpoints after the change | canvas health 200, collab WebSocket 101, `/ws-signal/info` 200, SSE 401 (anon), login API 400 (empty body), Google OAuth start → accounts.google.com, LiveKit `:7443` 200 | unchanged |
| Bundle secrets / source maps | grep of `dist` for every secret value in `.env`; `*.map` | none. The only match was the LiveKit API key, the word `innerview`, which is a key ID (not a secret) and appears in the `innerview.theme` storage key. |

**Not tested:** a signed-in session end to end (no test account on production; the `tests/e2e` suites
need local accounts) and a real video call. The auth change is small and keeps the previous path for
any browser that has had a session, but **sign in, reload, and join a room once** to confirm.

#### Lighthouse (lab data)

Lighthouse 12 in headless Chromium **on the server itself**, default simulated throttling, signed-out
`https://innerviewhub.com/`. Baseline is a single run (the old build no longer exists to re-run); "after"
is the median of 3 runs. This is lab data, not field data (INP needs real users; see CrUX/Search
Console later).

| | Perf | A11y | Best pr. | SEO | FCP | LCP | TBT | CLS | Transfer |
|---|---|---|---|---|---|---|---|---|---|
| Mobile before | 65 | 96 | 96 | 91 | 5.4 s | 5.6 s | 0 ms | 0 | 700 KiB |
| Mobile after | **92** (87–93) | **100** | **100** | **100** | **2.1 s** | **2.7 s** | 167 ms | 0 | **331 KiB** |
| Desktop before | 96 | 96 | 96 | 91 | 1.1 s | 1.1 s | 56 ms | 0.006 | 700 KiB |
| Desktop after | **100** | **100** | **100** | **100** | **0.46 s** | **0.54 s** | 0 ms | 0 | **331 KiB** |

Mobile TBT rose from 0 to ~170 ms although total main-thread work fell (4.2 s → 2.6 s). The page now
paints before the scripts finish, so their execution lands in the window TBT measures. Remaining
opportunities: ~88 KiB unused JS in the entry chunks and 2.6 s mobile main-thread work.


