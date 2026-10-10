// Shared helpers for the SEO checks. No dependencies: Node 22 with --experimental-strip-types
// (to import the TypeScript sources of truth directly).
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

export const ROOT = fileURLToPath(new URL('../../', import.meta.url))
export const read = (rel) => readFileSync(new URL(`../../${rel}`, import.meta.url), 'utf8')

let failures = 0
export const check = (id, ok, msg) => {
  if (!ok) failures++
  console.log(`${ok ? 'PASS' : 'FAIL'} ${id.padEnd(5)} ${msg}`)
}
export const done = () => {
  console.log(failures ? `\n${failures} check(s) failed` : '\nAll checks passed')
  process.exit(failures ? 1 : 0)
}

/** PUBLIC_PAGES etc. from frontend/src/seo/site.ts (run with `node --experimental-strip-types`). */
export const site = await import(new URL('../../frontend/src/seo/site.ts', import.meta.url).href)
export const publicPages = () => Object.entries(site.PUBLIC_PAGES).map(([key, page]) => ({ key, ...page }))

/** String-valued entries of `paths` in frontend/src/routes/paths.ts (e.g. login → '/login'). */
export function appPaths() {
  const src = read('frontend/src/routes/paths.ts')
  return Object.fromEntries([...src.matchAll(/^\s+(\w+): '([^']+)',/gm)].map((m) => [m[1], m[2]]))
}

/** The private-route regex from frontend/nginx.conf, as a JS RegExp. */
export function nginxPrivateRegex() {
  const conf = read('frontend/nginx.conf')
  const m = conf.match(/location ~ "(\^\/\(interviews[^"]+)"/)
  if (!m) throw new Error('private-route location not found in frontend/nginx.conf')
  return new RegExp(m[1])
}

/** `location = /x { return 301 /y… }` redirects from frontend/nginx.conf. */
export function nginxRedirects() {
  const conf = read('frontend/nginx.conf')
  return Object.fromEntries([...conf.matchAll(/location = (\/[\w/-]+)\s*\{\s*return 301 (\/[\w/-]*)\$is_args\$args;/g)].map((m) => [m[1], m[2]]))
}

export const attr = (html, re) => html.match(re)?.[1]
export const metaContent = (html, key) =>
  attr(html, new RegExp(`<meta (?:name|property)="${key.replace(/[:]/g, '\\$&')}" content="([^"]*)"`))
export const unescapeHtml = (s) => s?.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
