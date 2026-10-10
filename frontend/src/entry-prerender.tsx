/**
 * Build-time prerender entry (SSR bundle; never shipped to browsers). scripts/prerender.mjs calls
 * render() for each public page with `prerender: true` and writes the HTML into the page's file, where
 * main.tsx hydrates it. The tree must match main.tsx: same providers, same routes.
 */
import { StrictMode } from 'react'
import { prerenderToNodeStream } from 'react-dom/static'
import { createStaticHandler, createStaticRouter, StaticRouterProvider } from 'react-router-dom'
import { AppProviders } from '@/app/providers'
import { routes } from '@/app/router'

export { PUBLIC_PAGES, DEFAULT_SITE_URL } from '@/seo/site'
export { appHead, publicHead, robotsTxt, sitemapXml } from '@/seo/head'

export async function render(path: string, origin: string): Promise<string> {
  const handler = createStaticHandler(routes)
  const context = await handler.query(new Request(`${origin}${path}`))
  if (context instanceof Response) throw new Error(`${path}: the router answered with a redirect (${context.status})`)
  const router = createStaticRouter(handler.dataRoutes, context)

  // Waits for lazy routes and Suspense boundaries, so the HTML is complete.
  const { prelude } = await prerenderToNodeStream(
    <StrictMode>
      <AppProviders>
        <StaticRouterProvider router={router} context={context} hydrate={false} />
      </AppProviders>
    </StrictMode>,
  )
  let html = ''
  for await (const chunk of prelude) html += chunk
  return html
}
