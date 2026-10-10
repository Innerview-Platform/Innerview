import { LOGO_IMAGE, OG_IMAGE, PUBLIC_PAGES, SITE_ALTERNATE_NAME, SITE_NAME, pageTitle, type PublicPage } from './site'

/**
 * Builds the static <head> tags, robots.txt and sitemap.xml for the public pages. Runs at build time
 * only (scripts/prerender.mjs, through the SSR bundle of src/entry-prerender.tsx).
 */

const pages = () => Object.values(PUBLIC_PAGES) as PublicPage[]

export function publicHead(page: PublicPage, origin: string): string {
  const abs = (p: string) => `${origin}${p}`
  const title = pageTitle(page.title)
  const url = abs(page.path)
  const tags = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(page.description)}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:type" content="${page.schema === 'Article' ? 'article' : 'website'}" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:locale" content="en_US" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(page.description)}" />`,
    `<meta property="og:image" content="${abs(OG_IMAGE.path)}" />`,
    `<meta property="og:image:width" content="${OG_IMAGE.width}" />`,
    `<meta property="og:image:height" content="${OG_IMAGE.height}" />`,
    `<meta property="og:image:alt" content="${esc(OG_IMAGE.alt)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(page.description)}" />`,
    `<meta name="twitter:image" content="${abs(OG_IMAGE.path)}" />`,
    `<meta name="twitter:image:alt" content="${esc(OG_IMAGE.alt)}" />`,
  ]
  if (page.schema === 'Article' && page.published) {
    tags.push(`<meta property="article:published_time" content="${page.published}" />`)
    tags.push(`<meta property="article:modified_time" content="${page.lastModified}" />`)
  }
  if (page.sitemap) tags.push(jsonLd(page, origin))
  return tags.join('\n    ')
}

/** Shell for signed-in pages, rooms and 404s. nginx also sends X-Robots-Tag: noindex. */
export function appHead(): string {
  return [
    `<title>${SITE_NAME}</title>`,
    `<meta name="description" content="${esc(PUBLIC_PAGES.home.description)}" />`,
    `<meta name="robots" content="noindex" />`,
  ].join('\n    ')
}

function jsonLd(page: PublicPage, origin: string): string {
  const home = `${origin}/`
  const url = `${origin}${page.path}`
  const org = { '@id': `${home}#organization` }
  const image = { '@type': 'ImageObject', url: `${origin}${OG_IMAGE.path}`, width: OG_IMAGE.width, height: OG_IMAGE.height }
  const graph: Record<string, unknown>[] = []

  if (page.path === '/') {
    graph.push(
      {
        '@type': 'Organization',
        '@id': `${home}#organization`,
        name: SITE_NAME,
        alternateName: SITE_ALTERNATE_NAME,
        url: home,
        logo: { '@type': 'ImageObject', url: `${origin}${LOGO_IMAGE.path}`, width: LOGO_IMAGE.width, height: LOGO_IMAGE.height },
      },
      {
        '@type': 'WebSite',
        '@id': `${home}#website`,
        name: SITE_NAME,
        alternateName: [SITE_ALTERNATE_NAME, new URL(home).hostname],
        url: home,
        inLanguage: 'en',
        publisher: org,
      },
    )
  }

  graph.push({
    '@type': 'WebPage',
    '@id': `${url}#webpage`,
    url,
    name: pageTitle(page.title),
    description: page.description,
    inLanguage: 'en',
    isPartOf: { '@id': `${home}#website` },
    primaryImageOfPage: image,
    dateModified: page.lastModified,
    ...(page.breadcrumb ? { breadcrumb: { '@id': `${url}#breadcrumb` } } : { about: org }),
  })

  if (page.breadcrumb) {
    graph.push({
      '@type': 'BreadcrumbList',
      '@id': `${url}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: home },
        { '@type': 'ListItem', position: 2, name: page.breadcrumb, item: url },
      ],
    })
  }

  if (page.schema === 'Article') {
    graph.push({
      '@type': 'Article',
      '@id': `${url}#article`,
      headline: page.title,
      description: page.description,
      image,
      datePublished: page.published,
      dateModified: page.lastModified,
      inLanguage: 'en',
      author: { '@type': 'Organization', name: SITE_NAME, url: home },
      publisher: org,
      mainEntityOfPage: { '@id': `${url}#webpage` },
    })
  }

  const data = { '@context': 'https://schema.org', '@graph': graph }
  // `<` escaped so the JSON can never close the <script> element.
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`
}

export function robotsTxt(origin: string): string {
  return [
    'User-agent: *',
    // API and auth endpoints have no content for search. Signed-in pages are NOT disallowed: they
    // answer with `X-Robots-Tag: noindex`, which crawlers can only see if they may fetch the page.
    'Disallow: /api/',
    'Disallow: /actuator/',
    'Disallow: /oauth2/',
    'Disallow: /login/oauth2/',
    '',
    `Sitemap: ${origin}/sitemap.xml`,
    '',
  ].join('\n')
}

export function sitemapXml(origin: string): string {
  const urls = pages()
    .filter((page) => page.sitemap)
    .map((page) => `  <url>\n    <loc>${esc(`${origin}${page.path}`)}</loc>\n    <lastmod>${page.lastModified}</lastmod>\n  </url>`)
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`
}

function esc(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
