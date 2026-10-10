// Build-output check: the HTML, robots.txt and sitemap.xml written by frontend/scripts/prerender.mjs.
// Run after `pnpm run build`:  node --experimental-strip-types tests/seo/dist.check.mjs [path/to/dist]
// SITE_URL (default https://innerviewhub.com) must match the VITE_SITE_URL the build used.
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { ROOT, attr, check, done, metaContent, nginxPrivateRegex, nginxRedirects, publicPages, site, unescapeHtml } from './lib.mjs'

const DIST = path.resolve(process.argv[2] ?? path.join(ROOT, 'frontend/dist'))
const SITE = (process.env.SITE_URL ?? 'https://innerviewhub.com').replace(/\/+$/, '')
const file = (rel) => path.join(DIST, rel)
const pages = publicPages()
const publicPaths = new Set(pages.map((p) => p.path))
const privateRe = nginxPrivateRegex()
const redirects = nginxRedirects()

check('D0', pages.length >= 7, `read ${pages.length} public pages from src/seo/site.ts`)

const titles = new Set()
const descriptions = new Set()
const linkedFrom = new Map(pages.map((p) => [p.path, 0]))

for (const page of pages) {
  const rel = page.path === '/' ? 'index.html' : `${page.path.slice(1)}/index.html`
  if (!existsSync(file(rel))) {
    check('D1', false, `${rel} exists`)
    continue
  }
  const html = readFileSync(file(rel), 'utf8')
  const head = html.slice(0, html.indexOf('</head>'))
  const title = unescapeHtml(attr(head, /<title>([^<]*)<\/title>/))
  const description = unescapeHtml(metaContent(head, 'description'))
  const canonical = attr(head, /<link rel="canonical" href="([^"]+)"/)

  check('D1', (head.match(/<title>/g) ?? []).length === 1 && title === site.pageTitle(page.title), `${page.path}: title "${title}"`)
  check('D2', title.length <= 65 && description === page.description && (head.match(/name="description"/g) ?? []).length === 1, `${page.path}: one description, matches site.ts`)
  check('D3', canonical === `${SITE}${page.path}` && (head.match(/rel="canonical"/g) ?? []).length === 1 && metaContent(head, 'og:url') === canonical, `${page.path}: canonical ${canonical}`)
  check('D4', !/name="robots" content="[^"]*noindex/.test(head), `${page.path}: no noindex`)
  const ogImage = metaContent(head, 'og:image')
  check('D5', ogImage?.startsWith(`${SITE}/`) && existsSync(file(ogImage.slice(SITE.length))) && metaContent(head, 'twitter:card') === 'summary_large_image', `${page.path}: Open Graph/Twitter with image in the build`)
  check('D6', /<link rel="preload" href="\/assets\/geist-latin-[\w-]{8}\.woff2" as="font"/.test(head), `${page.path}: preloads the body font`)
  check('D7', !titles.has(title) && !descriptions.has(description), `${page.path}: title and description are unique`)
  titles.add(title)
  descriptions.add(description)

  // Structured data: on every sitemap page, none elsewhere.
  const blocks = [...head.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1])
  if (!page.sitemap) {
    check('J0', blocks.length === 0, `${page.path}: no JSON-LD`)
  } else {
    let graph = []
    try {
      const data = JSON.parse(blocks[0])
      graph = data['@graph'] ?? []
      check('J1', blocks.length === 1 && data['@context'] === 'https://schema.org', `${page.path}: one JSON-LD block, parses`)
    } catch (e) {
      check('J1', false, `${page.path}: JSON-LD parses (${e.message})`)
    }
    const byType = Object.fromEntries(graph.map((n) => [n['@type'], n]))
    const types = Object.keys(byType)
    check('J2', !!byType.WebPage && byType.WebPage.url === `${SITE}${page.path}` && byType.WebPage.dateModified === page.lastModified, `${page.path}: WebPage (${types.join(', ')})`)
    if (page.path === '/') check('J3', !!byType.Organization?.logo?.url && byType.WebSite?.name === site.SITE_NAME, '/: Organization with logo, WebSite name ' + byType.WebSite?.name)
    if (page.breadcrumb) {
      const items = byType.BreadcrumbList?.itemListElement ?? []
      check('J4', items.length === 2 && items[0].item === `${SITE}/` && items[1].item === `${SITE}${page.path}` && items[1].name === page.breadcrumb, `${page.path}: BreadcrumbList Home › ${page.breadcrumb}`)
    }
    if (page.schema === 'Article') {
      const a = byType.Article
      check('J5', a && a.headline === page.title && a.datePublished === page.published && a.dateModified === page.lastModified && a.author?.name === site.SITE_NAME, `${page.path}: Article headline, dates, author`)
    }
    const urls = JSON.stringify(graph).match(/https?:\/\/[^"]+/g) ?? []
    check('J6', urls.every((u) => u.startsWith(SITE) || u.startsWith('https://schema.org')), `${page.path}: JSON-LD URLs on the site origin`)
    check('J7', !/aggregateRating|"review"|offers|address|award/i.test(blocks[0] ?? ''), `${page.path}: no ratings, reviews, prices, addresses or awards`)
  }

  // Prerendered body: real content in the HTML, and every internal link goes somewhere real.
  const body = html.slice(html.indexOf('<div id="root">'))
  if (page.prerender) {
    const h1s = body.match(/<h1[\s>]/g) ?? []
    const text = body.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
    const words = text.split(' ').filter((w) => /[a-z]/i.test(w)).length
    check('B1', h1s.length === 1 && words >= (page.path === '/' ? 300 : 700), `${page.path}: prerendered, one <h1>, ${words} words`)
    check('B2', /<link rel="modulepreload" fetchpriority="low" crossorigin href="\/assets\/[^"]+\.js" \/>/.test(head) && !body.includes('Signing you in'), `${page.path}: page chunk preloaded, no loader in the HTML`)
    // The page is readable without JS: app code must not compete with first-paint CSS and fonts.
    const scripts = [...html.matchAll(/<script type="module"[^>]*>|<link rel="modulepreload"[^>]*>/g)].map((m) => m[0])
    check('B5', !/<link rel="stylesheet"/.test(head) && /<style>[\s\S]{20000,}?<\/style>/.test(head), `${page.path}: stylesheet inlined (no render-blocking CSS request)`)
    check('B4', scripts.length > 0 && scripts.every((tag) => tag.includes('fetchpriority="low"')), `${page.path}: ${scripts.length} script/preload tags, all fetchpriority=low`)
    for (const href of new Set([...body.matchAll(/href="(\/[^"#?]*)/g)].map((m) => m[1]))) {
      if (publicPaths.has(href)) linkedFrom.set(href, linkedFrom.get(href) + (href === page.path ? 0 : 1))
      const ok = publicPaths.has(href) || privateRe.test(href) || href in redirects || existsSync(file(href))
      check('B3', ok, `${page.path}: link ${href} resolves`)
    }
  } else {
    check('B1', body.startsWith('<div id="root"></div>'), `${page.path}: client-rendered (empty root)`)
  }
}

// Every sitemap page is linked from at least two other prerendered pages (no orphans).
for (const page of pages.filter((p) => p.sitemap && p.path !== '/')) check('L1', linkedFrom.get(page.path) >= 2, `${page.path}: linked from ${linkedFrom.get(page.path)} other pages`)

// app.html: the shell for signed-in pages and 404s.
const app = readFileSync(file('app.html'), 'utf8')
check('A1', /<meta name="robots" content="noindex" \/>/.test(app), 'app.html: noindex')
check('A2', !/rel="canonical"|property="og:|application\/ld\+json/.test(app) && app.includes('<div id="root"></div>'), 'app.html: no canonical/social/JSON-LD, empty root')
check('A3', !existsSync(file('.vite')), 'no Vite manifest in the served files')

// robots.txt
const robots = readFileSync(file('robots.txt'), 'utf8')
check('R1', robots.includes(`Sitemap: ${SITE}/sitemap.xml`) && /^User-agent: \*$/m.test(robots) && !/^Disallow: \/\s*$/m.test(robots), 'robots.txt: sitemap listed, site not blocked')
for (const page of pages) {
  const blocked = [...robots.matchAll(/^Disallow: (\S+)/gm)].some((m) => page.path.startsWith(m[1]))
  check('R2', !blocked, `robots.txt: ${page.path} is crawlable`)
}

// sitemap.xml
const sitemap = readFileSync(file('sitemap.xml'), 'utf8')
const entries = [...sitemap.matchAll(/<url>\s*<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>\s*<\/url>/g)].map((m) => [m[1], m[2]])
const expected = pages.filter((p) => p.sitemap).map((p) => [`${SITE}${p.path}`, p.lastModified])
check('S1', sitemap.startsWith('<?xml version="1.0" encoding="UTF-8"?>') && sitemap.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">') && sitemap.trim().endsWith('</urlset>'), 'sitemap.xml: declaration and namespace')
check('S2', (sitemap.match(/<url>/g) ?? []).length === entries.length, 'sitemap.xml: every <url> has <loc> and <lastmod>')
check('S3', JSON.stringify(entries) === JSON.stringify(expected), `sitemap.xml: exactly the sitemap pages with their lastModified (${entries.length})`)

done()
