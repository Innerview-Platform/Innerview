/**
 * Site identity and the public, crawlable pages. This is the single source for each public page's
 * static <head> and prerendered body (scripts/prerender.mjs via src/entry-prerender.tsx), robots.txt,
 * sitemap.xml, the titles set at runtime and the SEO checks in tests/seo, so they never disagree.
 *
 * No imports and only erasable TypeScript: the checks load this file with `node --experimental-strip-types`.
 */

export const SITE_NAME = 'InnerViewHub'
/** The product's earlier name, still found around the web; listed so searches for it find the site. */
export const SITE_ALTERNATE_NAME = 'InnerView'
/** Production origin, used when VITE_SITE_URL isn't set. No trailing slash. */
export const DEFAULT_SITE_URL = 'https://innerviewhub.com'

/** 1200×630 social preview image and square logo in `public/`. */
export const OG_IMAGE = { path: '/og-image.png', width: 1200, height: 630, alt: 'InnerViewHub — mock technical interviews with someone you choose' }
export const LOGO_IMAGE = { path: '/icon-512.png', width: 512, height: 512 }

export interface PublicPage {
  path: string
  /** Without the brand suffix; see pageTitle(). Keep the full title at 65 characters or fewer. */
  title: string
  description: string
  /** Listed in sitemap.xml. Sign-in/sign-up stay indexable for brand searches but aren't worth listing. */
  sitemap: boolean
  /** Body rendered to HTML at build time (and hydrated), so crawlers and first paint don't wait for JS. */
  prerender: boolean
  /** Editorial pages get Article markup; the rest WebPage. */
  schema: 'WebPage' | 'Article'
  /** Breadcrumb label; pages below the home page get BreadcrumbList markup. */
  breadcrumb?: string
  /**
   * Date the page's content last changed meaningfully (YYYY-MM-DD). Used for sitemap <lastmod> and
   * Article dateModified. Update it by hand with the content, never automatically.
   */
  lastModified: string
  /** Article datePublished. */
  published?: string
}

export const PUBLIC_PAGES = {
  home: {
    path: '/',
    title: 'Peer mock interviews for software engineers',
    description:
      'Practice coding, system design and behavioral interviews with a peer you invite: live video, a shared editor you can run, a whiteboard and structured feedback.',
    sitemap: true,
    prerender: true,
    schema: 'WebPage',
    lastModified: '2026-10-09',
  },
  systemDesignMockInterview: {
    path: '/system-design-mock-interview',
    title: 'System design mock interviews with a peer',
    description:
      'Run a system design mock interview with someone you choose: a shared whiteboard, video, a 60-minute plan, practice prompts and a five-part design scorecard.',
    sitemap: true,
    prerender: true,
    schema: 'WebPage',
    breadcrumb: 'System design mock interviews',
    lastModified: '2026-10-09',
  },
  mockCodingInterview: {
    path: '/mock-coding-interview',
    title: 'Mock coding interview practice with a peer',
    description:
      'Practice coding interviews with a peer in one shared editor: run code, test against hidden test cases, follow a 45-minute plan and score with a five-part rubric.',
    sitemap: true,
    prerender: true,
    schema: 'WebPage',
    breadcrumb: 'Mock coding interviews',
    lastModified: '2026-10-09',
  },
  mockInterviewWithAFriend: {
    path: '/mock-interview-with-a-friend',
    title: 'How to run a mock interview with a friend',
    description:
      'A practical guide to mock interviews with a friend: ground rules, timings for coding, system design and behavioral rounds, a hint ladder and useful feedback.',
    sitemap: true,
    prerender: true,
    schema: 'Article',
    breadcrumb: 'Mock interview with a friend',
    lastModified: '2026-10-09',
    published: '2026-10-09',
  },
  feedbackRubric: {
    path: '/mock-interview-feedback-rubric',
    title: 'Mock interview feedback rubric and scorecard',
    description:
      'Mock interview feedback rubric: scorecards for coding, system design, technical and behavioral rounds, 1–5 anchors, a hire signal scale and a template.',
    sitemap: true,
    prerender: true,
    schema: 'Article',
    breadcrumb: 'Mock interview feedback rubric',
    lastModified: '2026-10-09',
    published: '2026-10-09',
  },
  login: {
    path: '/login',
    title: 'Sign in',
    description: 'Sign in to InnerViewHub to schedule mock interviews, join your interview room and read the feedback from your sessions.',
    sitemap: false,
    prerender: false,
    schema: 'WebPage',
    lastModified: '2026-10-09',
  },
  signup: {
    path: '/signup',
    title: 'Create account',
    description:
      'Create a free InnerViewHub account to practice coding, system design, technical and behavioral interviews with another engineer and trade structured feedback.',
    sitemap: false,
    prerender: false,
    schema: 'WebPage',
    lastModified: '2026-10-09',
  },
} as const satisfies Record<string, PublicPage>

export function pageTitle(title: string): string {
  return title ? `${title} · ${SITE_NAME}` : SITE_NAME
}
