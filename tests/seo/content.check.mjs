// Source check: the public pages stay truthful and wired up.
//  - The rubric published on the content pages is the one the product uses (backend FeedbackRubric.java,
//    frontend hire-signal labels), word for word.
//  - Every public page has a title/description within limits, a valid lastModified date, and, if
//    prerendered, a route in the router and a module mapping in scripts/prerender.mjs.
// Run: node --experimental-strip-types tests/seo/content.check.mjs
import { appPaths, check, done, publicPages, read, site } from './lib.mjs'

const rubric = await import(new URL('../../frontend/src/features/marketing/rubric.ts', import.meta.url).href)

// ── Rubric matches the backend ────────────────────────────────────────────────
const java = read('services/spring-boot/src/main/java/com/innerview/spring/dto/feedback/FeedbackRubric.java')
const criteria = (block) => [...block.matchAll(/(?:new Criterion\("\w+", "([^"]+)", "([^"]+)"\)|(COMMUNICATION))/g)].map((m) => (m[3] ? 'COMMUNICATION' : `${m[1]}|${m[2]}`))
const communication = java.match(/COMMUNICATION =\s*new Criterion\("\w+", "([^"]+)", "([^"]+)"\)/)
const resolve = (list) => list.map((c) => (c === 'COMMUNICATION' ? `${communication[1]}|${communication[2]}` : c))
const javaCase = (name) => {
  const start = java.indexOf(name === 'default' ? 'default -> List.of(' : `case ${name} -> List.of(`)
  return resolve(criteria(java.slice(start, java.indexOf(');', start))))
}
const published = (list) => list.map((c) => `${c.label}|${c.description}`)
const pairs = [
  ['problemSolving', javaCase('PROBLEM_SOLVING')],
  ['systemDesign', javaCase('SYSTEM_DESIGN')],
  ['behavioral', javaCase('HR')],
  ['technical', javaCase('default')],
  ['forInterviewer', resolve(criteria(java.slice(java.indexOf('FOR_INTERVIEWER'))))],
]
for (const [key, expected] of pairs) {
  check('C1', expected.length >= 3 && JSON.stringify(published(rubric.RUBRICS[key])) === JSON.stringify(expected), `rubric "${key}" matches FeedbackRubric.java (${expected.length} criteria)`)
}
const labels = read('frontend/src/features/feedback/utils/reviewLabels.ts')
const signals = [...labels.matchAll(/: \{ label: '([^']+)', tone/g)].map((m) => m[1])
check('C2', JSON.stringify(signals) === JSON.stringify([...rubric.HIRE_SIGNALS]), `hire signals match the app (${signals.join(', ')})`)

// ── Public pages are complete and wired ───────────────────────────────────────
const router = read('frontend/src/app/router.tsx')
const prerenderScript = read('frontend/scripts/prerender.mjs')
const paths = appPaths()
const today = new Date().toISOString().slice(0, 10)
const titles = new Set()
for (const page of publicPages()) {
  const full = site.pageTitle(page.title)
  check('C3', full.length >= 15 && full.length <= 65 && !titles.has(full), `${page.path}: title "${full}" (${full.length} chars, unique)`)
  titles.add(full)
  check('C4', page.description.length >= 70 && page.description.length <= 170, `${page.path}: description ${page.description.length} chars`)
  check('C5', /^\d{4}-\d{2}-\d{2}$/.test(page.lastModified) && page.lastModified <= today, `${page.path}: lastModified ${page.lastModified} is a real date, not in the future`)
  if (page.schema === 'Article') check('C6', !!page.published && page.published <= page.lastModified, `${page.path}: Article has datePublished ≤ dateModified`)
  if (page.prerender) {
    const key = Object.keys(paths).find((k) => paths[k] === page.path)
    check('C7', page.path === '/' || (key && router.includes(`path: paths.${key}`)), `${page.path}: route in router.tsx`)
    check('C8', prerenderScript.includes(`'${page.path}':`), `${page.path}: page module mapped in scripts/prerender.mjs`)
  }
  if (page.breadcrumb) check('C9', page.path !== '/' && page.sitemap, `${page.path}: breadcrumb pages are in the sitemap`)
}

done()
