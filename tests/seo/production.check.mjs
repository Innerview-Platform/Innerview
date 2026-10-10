// Live check against the deployed site: status codes, redirects, robots directives, sitemap,
// compression and security headers. Run: node --experimental-strip-types tests/seo/production.check.mjs
//   BASE=https://innerviewhub.com  WWW=https://www.innerviewhub.com  IP=187.124.30.226 (optional)
// Needs `node --experimental-strip-types` (reads frontend/src/seo/site.ts).
import { attr, check, done, publicPages } from './lib.mjs'

const BASE = (process.env.BASE ?? 'https://innerviewhub.com').replace(/\/+$/, '')
const WWW = process.env.WWW ?? BASE.replace('://', '://www.')
const IP = process.env.IP
const host = new URL(BASE).host
const get = (url, init = {}) => fetch(url, { redirect: 'manual', ...init })
const robotsHeader = (res) => res.headers.get('x-robots-tag') ?? ''

// Public pages: 200, indexable, own canonical.
for (const page of publicPages()) {
  const res = await get(BASE + page.path)
  const html = await res.text()
  const canonical = attr(html, /<link rel="canonical" href="([^"]+)"/)
  check('P1', res.status === 200, `${page.path}: ${res.status}`)
  check('P2', !/noindex/.test(robotsHeader(res)) && !/name="robots" content="[^"]*noindex/.test(html), `${page.path}: indexable`)
  check('P3', canonical === BASE + page.path, `${page.path}: canonical ${canonical}`)
}

// Signed-in pages and rooms: the app shell with noindex (the API still enforces access).
for (const path of ['/interviews', '/interviews/new', '/problems', '/feedback', '/settings/profile', '/u/someone', '/join', '/forgot-password', '/abc-defg-hij']) {
  const res = await get(BASE + path)
  const html = await res.text()
  check('N1', res.status === 200 && /noindex/.test(robotsHeader(res)) && /name="robots" content="noindex"/.test(html), `${path}: 200, X-Robots-Tag "${robotsHeader(res)}"`)
}

// Unknown paths: a real 404 (the SPA still renders its "Page not found" page).
for (const path of ['/this-page-does-not-exist', '/interviews/1/2/3', '/wp-login.php']) {
  const res = await get(BASE + path)
  check('N2', res.status === 404 && /noindex/.test(robotsHeader(res)), `${path}: ${res.status}, X-Robots-Tag "${robotsHeader(res)}"`)
}
const missingAsset = await get(`${BASE}/assets/does-not-exist.js`)
check('N3', missingAsset.status === 404 && !(await missingAsset.text()).includes('<div id="root">'), `/assets/does-not-exist.js: ${missingAsset.status}, not the SPA`)

// API and auth endpoints are not for search.
for (const path of ['/api/interviews', '/actuator/health']) {
  const res = await get(BASE + path)
  check('N4', /noindex/.test(robotsHeader(res)), `${path}: X-Robots-Tag "${robotsHeader(res)}"`)
}

// Redirects: one permanent hop to the canonical URL, path and query kept.
const redirectCases = [
  [`http://${host}/login?x=1`, `${BASE}/login?x=1`],
  [`${WWW}/signup?ref=a`, `${BASE}/signup?ref=a`],
  [`http://${new URL(WWW).host}/`, null], // http www: one hop to https www or straight to the apex
  [`${BASE}/dashboard?x=1`, '/?x=1'],
  [`${BASE}/register`, '/signup'],
  [`${BASE}/settings`, '/settings/profile'],
  [`${BASE}/room/join`, '/join'],
]
if (IP) redirectCases.push([`https://${IP}/login?x=1`, `${BASE}/login?x=1`])
for (const [from, to] of redirectCases) {
  const res = await get(from)
  const location = res.headers.get('location')
  check('X1', [301, 308].includes(res.status) && (to === null || location === to), `${from} → ${res.status} ${location}`)
}
// Following the www redirect chain ends on the canonical page in at most two hops, without loops.
{
  let url = `http://${new URL(WWW).host}/login`
  const seen = []
  for (let i = 0; i < 5; i++) {
    const res = await get(url)
    if (![301, 302, 307, 308].includes(res.status)) break
    seen.push(url)
    url = new URL(res.headers.get('location'), url).toString()
  }
  check('X2', url === `${BASE}/login` && seen.length <= 2, `http://www…/login reaches ${url} in ${seen.length} hop(s)`)
}

// robots.txt and sitemap.xml
const robots = await get(`${BASE}/robots.txt`)
const robotsText = await robots.text()
check('B1', robots.status === 200 && /^text\/plain/.test(robots.headers.get('content-type')), `/robots.txt: ${robots.status} ${robots.headers.get('content-type')}`)
check('B2', robotsText.includes(`Sitemap: ${BASE}/sitemap.xml`) && !/^Disallow: \/\s*$/m.test(robotsText), '/robots.txt: sitemap listed, site not blocked')
const sitemap = await get(`${BASE}/sitemap.xml`)
const sitemapText = await sitemap.text()
check('S1', sitemap.status === 200 && /xml/.test(sitemap.headers.get('content-type')) && sitemapText.startsWith('<?xml'), `/sitemap.xml: ${sitemap.status} ${sitemap.headers.get('content-type')}`)
for (const loc of [...sitemapText.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])) {
  const res = await get(loc)
  const html = await res.text()
  check('S2', res.status === 200 && attr(html, /<link rel="canonical" href="([^"]+)"/) === loc && !/noindex/.test(robotsHeader(res)), `sitemap URL ${loc}: 200, self-canonical, indexable`)
}

// Prerendered pages: the content is in the HTML before any JavaScript runs, and every internal link works.
const links = new Set()
for (const page of publicPages().filter((p) => p.prerender)) {
  const html = await (await get(BASE + page.path)).text()
  const body = html.slice(html.indexOf('<div id="root">'))
  check('P4', /<h1[\s>]/.test(body) && body.length > 5000, `${page.path}: body prerendered (${body.length} bytes of HTML)`)
  for (const m of body.matchAll(/href="(\/[^"#?]*)/g)) links.add(m[1])
}
for (const link of links) {
  const res = await get(BASE + link)
  check('L1', [200, 301].includes(res.status), `internal link ${link}: ${res.status}`)
}

// Delivery: compression, caching, security headers.
const home = await get(`${BASE}/`, { headers: { 'accept-encoding': 'gzip, br, zstd' } })
const entry = attr(await home.clone().text(), /src="(\/assets\/index-[\w-]+\.js)"/)
const js = entry && (await get(BASE + entry, { method: 'HEAD', headers: { 'accept-encoding': 'gzip' } }))
check('C1', !!js && /gzip|br|zstd/.test(js.headers.get('content-encoding') ?? ''), `${entry}: content-encoding ${js?.headers.get('content-encoding')}`)
check('C2', /immutable/.test(js?.headers.get('cache-control') ?? '') && /no-cache/.test(home.headers.get('cache-control') ?? ''), 'hashed assets immutable, HTML no-cache')
const h = (name) => home.headers.get(name) ?? ''
check('H1', /max-age=\d{7,}/.test(h('strict-transport-security')), `HSTS: ${h('strict-transport-security')}`)
check('H2', h('x-content-type-options') === 'nosniff', `X-Content-Type-Options: ${h('x-content-type-options')}`)
check('H3', /frame-ancestors 'self'/.test(h('content-security-policy')) && h('x-frame-options') === 'SAMEORIGIN', `framing: CSP "${h('content-security-policy')}", XFO ${h('x-frame-options')}`)
check('H4', !!h('referrer-policy') && /camera=\(self\)/.test(h('permissions-policy')), `Referrer-Policy ${h('referrer-policy')}; Permissions-Policy allows camera/mic for the room`)
check('H5', !/\d/.test(h('server')), `Server header has no version: "${h('server')}"`)
const api = await get(`${BASE}/api/interviews`)
check('H6', api.headers.get('x-frame-options') === 'DENY' && (api.headers.get('strict-transport-security') ?? '').split(',').length === 1, 'API keeps Spring Security headers (no duplicates)')

done()
