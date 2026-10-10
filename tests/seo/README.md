# SEO checks

Node 22 scripts in the same PASS/FAIL style as `tests/e2e`, run with `--experimental-strip-types` so
they import the TypeScript sources of truth (`frontend/src/seo/site.ts`, `frontend/src/features/marketing/rubric.ts`)
directly. No npm dependencies, except `browser.check.mjs`.

| Script | Needs | Covers |
|---|---|---|
| `routes.check.mjs` | source | Every route in `router.tsx` is handled by `nginx.conf`: public pages get their own HTML, signed-in routes and room codes get the `noindex` shell, legacy URLs 301, unknown paths 404. |
| `content.check.mjs` | source | The rubric published on the content pages matches the backend's `FeedbackRubric.java` word for word, and the hire signals match the app. Every public page has a unique title ≤ 65 chars, a 70–170-char description, a real `lastModified` (not in the future), and, if prerendered, a route and a module mapping in `scripts/prerender.mjs`. |
| `dist.check.mjs` | a build (`frontend/dist`) | Per page: title/description/canonical/OG/Twitter, no `noindex`, font preload. JSON-LD on sitemap pages (WebPage everywhere; Organization + WebSite on `/`; BreadcrumbList; Article with dates and author), no invented ratings/prices/addresses. Prerendered pages contain one `<h1>` and their full text, preload their chunk, and every internal link resolves. No orphan pages (each sitemap page linked from ≥ 2 others). `app.html` is `noindex`. robots.txt and sitemap.xml (with `lastmod` from `site.ts`). |
| `production.check.mjs` | the live site | Status codes, redirects (HTTP→HTTPS, www→apex, IP→domain, trailing slash, legacy paths; one hop, path and query kept), robots/sitemap, sitemap URLs 200 + self-canonical, prerendered body present, internal links, compression, caching, security headers. |
| `browser.check.mjs` | Chromium + puppeteer-core (Docker image in `docker/`) | Prerendered pages hydrate with no mismatch or console errors, are interactive, navigate client-side; a returning visitor skips hydration; 404 and private routes behave. |

```bash
cd frontend && pnpm run build && pnpm run check:seo      # routes + content + build output (also in CI)
node --experimental-strip-types tests/seo/production.check.mjs           # live site
IP=187.124.30.226 node --experimental-strip-types tests/seo/production.check.mjs

# Browser check and Lighthouse, from the repo root:
docker build -t seo-lighthouse tests/seo/docker
docker run --rm --network host -v "$PWD":/repo -w /repo -e BASE=https://innerviewhub.com seo-lighthouse \
  sh -c 'LH=$(npm root -g)/lighthouse node tests/seo/browser.check.mjs'
docker run --rm --network host seo-lighthouse lighthouse https://innerviewhub.com/ --quiet \
  --chrome-flags="--headless=new --no-sandbox" --output=json --output-path=stdout > lighthouse.json
```

`dist.check.mjs` assumes the build used `VITE_SITE_URL=https://innerviewhub.com`; set `SITE_URL` to
match when building for another origin.

Public page titles, descriptions and dates live in `frontend/src/seo/site.ts`.
