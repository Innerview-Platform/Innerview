// Static check: the routes in frontend/src/app/router.tsx and the URL handling in frontend/nginx.conf
// agree. A route nginx doesn't know becomes a 404; a signed-in route outside the private pattern
// loses its noindex. Run: node --experimental-strip-types tests/seo/routes.check.mjs
import { appPaths, check, done, nginxPrivateRegex, nginxRedirects, publicPages, read } from './lib.mjs'

const router = read('frontend/src/app/router.tsx')
const paths = appPaths()
const publicSet = new Set(publicPages().map((p) => p.path))
const privateRe = nginxPrivateRegex()
const redirects = nginxRedirects()

// Every `path:` in the router, resolved through paths.ts, with params replaced by sample values.
const routePaths = [...router.matchAll(/path: (?:paths\.(\w+)|'([^']+)')/g)].map((m) => (m[1] ? paths[m[1]] : m[2]))
check('R0', routePaths.length >= 20 && !routePaths.includes(undefined), `read ${routePaths.length} routes from router.tsx`)

const sample = (p) =>
  p
    .replace(':interviewId', '42')
    .replace(':slug', 'two-sum')
    .replace(':username', 'alice')
    .replace(':roomId', 'abc123')
    .replace(':code', 'abc-defg-hij')

const protectedBlock = router.slice(router.indexOf('<ProtectedRoute />'), router.indexOf('// Legacy URLs.'))
for (const path of routePaths) {
  if (path === '*') continue
  const url = sample(path)
  // nginx precedence: exact `location =` blocks (public pages, redirects) win over the regex, which
  // matters for six-letter paths like /signup that also look like legacy room codes.
  const isPublic = publicSet.has(url)
  const isRedirect = !isPublic && url in redirects
  const isPrivate = !isPublic && !isRedirect && privateRe.test(url)
  check('R1', isPublic || isRedirect || isPrivate, `${path} → ${isPublic ? 'public page' : isPrivate ? 'app shell (noindex)' : isRedirect ? `301 ${redirects[url]}` : 'NOT HANDLED (would 404)'}`)
}

// Signed-in routes must never be served as an indexable public page.
for (const m of protectedBlock.matchAll(/path: (?:paths\.(\w+)|'([^']+)')/g)) {
  const url = sample(m[1] ? paths[m[1]] : m[2])
  check('R2', privateRe.test(url) && !publicSet.has(url), `protected ${url} is noindex`)
}

// Room codes in every accepted shape, and paths that must stay 404s.
for (const url of ['/abc-defg-hij', '/abcdefghij', '/ABC-DEFG-HIJ', '/x9k2m1']) check('R3', privateRe.test(url), `room code ${url} → app shell`)
for (const url of ['/totally-missing-page', '/interviews/1/2/3', '/settings/other', '/u', '/abc-defg-hi', '/wp-admin'])
  check('R4', !privateRe.test(url) && !publicSet.has(url) && !(url in redirects), `${url} → 404`)

// Legacy redirects point at real routes, the same ones the router's <Navigate> uses.
const legacy = { '/dashboard': '/', '/register': '/signup', '/profile': '/settings/profile', '/settings': '/settings/profile', '/room/join': '/join' }
for (const [from, to] of Object.entries(legacy)) check('R5', redirects[from] === to, `${from} → 301 ${to}`)

// Public pages exist in the router and nginx serves their own HTML file.
const conf = read('frontend/nginx.conf')
for (const path of publicSet) {
  const file = path === '/' ? '/index.html' : `${path}/index.html`
  check('R6', new RegExp(`location = ${path.replace(/\//g, '\\/')} \\{[^}]*try_files ${file.replace(/\//g, '\\/')} =404`).test(conf), `${path} served from ${file}`)
}

done()
