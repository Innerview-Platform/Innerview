// Browser check (needs Chromium + puppeteer-core, so it is not part of CI): prerendered pages hydrate
// without mismatches or console errors, are interactive, navigate client-side; a returning visitor
// skips hydration; 404s and private routes behave. See README.md for the one-line Docker command.
//   BASE=https://innerviewhub.com LH=<dir containing puppeteer-core's package> node tests/seo/browser.check.mjs
import { createRequire } from 'node:module'
const require = createRequire(process.env.LH + '/package.json')
const puppeteer = require('puppeteer-core')
const BASE = process.env.BASE
const browser = await puppeteer.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox', '--headless=new'] })
let fails = 0
const ok = (c, m) => { if (!c) fails++; console.log(`${c ? 'PASS' : 'FAIL'} ${m}`) }

async function visit(path, { session = false } = {}) {
  const page = await browser.newPage()
  const errors = []
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errors.push(m.text().slice(0, 200)) })
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message.slice(0, 200)))
  if (session) await page.evaluateOnNewDocument(() => localStorage.setItem('innerview.hasSession', '1'))
  await page.goto(BASE + path, { waitUntil: 'networkidle0' })
  return { page, errors }
}

for (const path of ['/', '/system-design-mock-interview', '/mock-coding-interview', '/mock-interview-with-a-friend', '/mock-interview-feedback-rubric']) {
  const { page, errors } = await visit(path)
  const hydrationErrors = errors.filter((e) => /hydrat|did not match|Minified React error #4(18|19|21|22|23|25)/i.test(e))
  ok(hydrationErrors.length === 0, `${path}: no hydration errors${hydrationErrors.length ? ' — ' + hydrationErrors[0] : ''}`)
  ok(errors.length === 0, `${path}: no console errors/warnings${errors.length ? ' — ' + errors.join(' | ') : ''}`)
  // Interactive after hydration: the theme toggle flips the theme.
  const before = await page.evaluate(() => document.documentElement.dataset.theme)
  await page.click('header button[aria-label^="Switch to"]')
  const after = await page.evaluate(() => document.documentElement.dataset.theme)
  ok(before !== after, `${path}: theme toggle works after hydration (${before} → ${after})`)
  const h1 = await page.$eval('h1', (el) => el.textContent.trim().slice(0, 50))
  ok(h1.length > 10, `${path}: h1 "${h1}"`)
  await page.close()
}

// Client-side navigation between prerendered pages (no full reload).
{
  const { page, errors } = await visit('/mock-coding-interview')
  await page.evaluate(() => (window.__noReload = true))
  await page.click('footer a[href="/mock-interview-feedback-rubric"]')
  await page.waitForFunction(() => location.pathname === '/mock-interview-feedback-rubric')
  await page.waitForSelector('h1')
  const sameDoc = await page.evaluate(() => window.__noReload === true)
  const title = await page.title()
  ok(sameDoc && /rubric/i.test(title), `SPA navigation coding → rubric without reload, title "${title}"`)
  await page.click('header a[href="/signup"]')
  await page.waitForFunction(() => location.pathname === '/signup')
  await page.waitForSelector('input[type="password"]')
  ok(true, 'SPA navigation to /signup renders the sign-up form')
  ok(errors.length === 0, `navigation: no console errors${errors.length ? ' — ' + errors.join(' | ') : ''}`)
  await page.close()
}

// A returning visitor (session hint): no hydration; prerendered markup hidden, then the app renders.
{
  const { page, errors } = await visit('/', { session: true })
  const restoring = await page.evaluate(() => 'restoring' in document.documentElement.dataset)
  const h1 = await page.$eval('h1', (el) => el.textContent.trim().slice(0, 40)).catch(() => null)
  const hydrationErrors = errors.filter((e) => /hydrat/i.test(e))
  ok(!restoring && !!h1 && hydrationErrors.length === 0, `returning visitor on /: restoring flag cleared, landing shown after refresh check (h1 "${h1}")`)
  console.log('   console:', errors.join(' | ') || 'none')
  await page.close()
}

// A 404 and a private route still behave.
{
  const { page } = await visit('/nope-not-here')
  ok((await page.title()).startsWith('Page not found'), '/nope-not-here: Page not found')
  await page.close()
  const r = await visit('/interviews')
  ok(r.page.url().endsWith('/login'), '/interviews (signed out): redirected to /login')
  await r.page.close()
}

await browser.close()
console.log(fails ? `\n${fails} failed` : '\nAll browser checks passed')
process.exit(fails ? 1 : 0)
