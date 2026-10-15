// Post-build step (`pnpm run build`): turns dist/index.html into one HTML file per public page with its
// own <head> and, where `prerender: true`, the page body rendered at build time; plus app.html (the
// noindex shell for signed-in pages and 404s), robots.txt and sitemap.xml. nginx.conf maps URLs to them.
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
const dist = path.join(root, 'dist')
const ssrEntry = path.join(root, 'dist-ssr', 'entry-prerender.js')

const { render, PUBLIC_PAGES, DEFAULT_SITE_URL, publicHead, appHead, robotsTxt, sitemapXml } = await import(pathToFileURL(ssrEntry).href)
const origin = (process.env.VITE_SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/, '')

const template = readFileSync(path.join(dist, 'index.html'), 'utf8')
const SEO_BLOCK = /<!-- seo:start -->[\s\S]*<!-- seo:end -->/
if (!SEO_BLOCK.test(template)) throw new Error('index.html is missing the <!-- seo:start --> … <!-- seo:end --> block')
if (!template.includes('<div id="root"></div>')) throw new Error('index.html is missing <div id="root"></div>')

// Vite's manifest maps each lazy page module to its chunk, so a prerendered page can preload its own code
// and hydrate without waiting for a second round trip.
const manifest = JSON.parse(readFileSync(path.join(dist, '.vite', 'manifest.json'), 'utf8'))
const pageModules = {
  '/': 'src/features/landing/pages/LandingPage.tsx',
  '/system-design-mock-interview': 'src/features/marketing/pages/SystemDesignMockInterviewPage.tsx',
  '/mock-coding-interview': 'src/features/marketing/pages/MockCodingInterviewPage.tsx',
  '/mock-interview-with-a-friend': 'src/features/marketing/pages/MockInterviewWithAFriendPage.tsx',
  '/mock-interview-feedback-rubric': 'src/features/marketing/pages/FeedbackRubricPage.tsx',
}
function chunkPreloads(pagePath) {
  const key = pageModules[pagePath]
  if (!key) return ''
  if (!manifest[key]) throw new Error(`${key} is not in the Vite manifest`)
  const files = new Set()
  const visit = (k) => {
    const entry = manifest[k]
    if (!entry || entry.isEntry || files.has(entry.file)) return
    files.add(entry.file)
    for (const dep of entry.imports ?? []) visit(dep)
  }
  visit(key)
  return [...files].map((file) => `\n    <link rel="modulepreload" crossorigin href="/${file}" />`).join('')
}

/** The latin subsets the first screen uses (body text and the serif headline), by hashed name. */
const assets = readdirSync(path.join(dist, 'assets'))
const fontPreloads = [/^geist-latin-[\w-]{8}\.woff2$/, /^instrument-serif-latin-[\w-]{8}\.woff2$/, /^instrument-serif-italic-latin-[\w-]{8}\.woff2$/]
  .map((re) => assets.find((name) => re.test(name)))
  .filter(Boolean)
  .map((name) => `\n    <link rel="preload" href="/assets/${name}" as="font" type="font/woff2" crossorigin />`)
  .join('')

const write = (file, html) => {
  mkdirSync(path.dirname(path.join(dist, file)), { recursive: true })
  writeFileSync(path.join(dist, file), html)
}

for (const page of Object.values(PUBLIC_PAGES)) {
  const head = publicHead(page, origin) + fontPreloads + (page.prerender ? chunkPreloads(page.path) : '')
  let html = template.replace(SEO_BLOCK, head)
  if (page.prerender) {
    const body = await render(page.path, origin)
    if (!body.includes('<h1')) throw new Error(`${page.path}: prerendered HTML has no <h1>`)
    html = html.replace('<div id="root"></div>', `<div id="root">${body}</div>`)
    // The page is readable without JS, so nothing may compete with what the first paint needs. The
    // stylesheet is inlined (no render-blocking request), and the app code is fetched at low priority.
    html = html
      .replace(/<link rel="stylesheet" crossorigin href="\/(assets\/[\w.-]+\.css)">/, (_, css) => {
        const text = readFileSync(path.join(dist, css), 'utf8')
        if (text.includes('</style')) throw new Error(`${css} contains "</style"`)
        return `<style>${text}</style>`
      })
      .replace(/<script type="module" crossorigin src=/g, '<script type="module" fetchpriority="low" crossorigin src=')
      .replace(/<link rel="modulepreload" crossorigin href=/g, '<link rel="modulepreload" fetchpriority="low" crossorigin href=')
  }
  write(page.path === '/' ? 'index.html' : `${page.path.slice(1)}/index.html`, html)
  console.log(`prerender: ${page.path}${page.prerender ? ' (body)' : ' (head only)'}`)
}

write('app.html', template.replace(SEO_BLOCK, appHead() + fontPreloads))
write('robots.txt', robotsTxt(origin))
write('sitemap.xml', sitemapXml(origin))

// The manifest is a build artifact, not something to serve.
rmSync(path.join(dist, '.vite'), { recursive: true, force: true })
if (existsSync(path.join(root, 'dist-ssr'))) rmSync(path.join(root, 'dist-ssr'), { recursive: true, force: true })
console.log(`prerender: app.html, robots.txt, sitemap.xml for ${origin}`)
