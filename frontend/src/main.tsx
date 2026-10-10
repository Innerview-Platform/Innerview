import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AppProviders } from '@/app/providers'
import { routes } from '@/app/router'
import { isGoogleReturn } from '@/features/auth/components/AuthBootstrap'
import { mayHaveSession } from '@/features/auth/utils/session'
import '@/styles/index.css'

const container = document.getElementById('root')!
const app = (
  <StrictMode>
    <AppProviders>
      <RouterProvider router={createBrowserRouter(routes)} />
    </AppProviders>
  </StrictMode>
)

// Public pages arrive prerendered for a signed-out visitor (scripts/prerender.mjs). Hydrate when this
// visitor's first render is exactly that; otherwise (a session to restore, a Google sign-in return)
// start from scratch as before. The pre-paint script in index.html hides the prerendered markup for
// those visitors (html[data-restoring]) so it doesn't flash before the session check.
if (container.firstElementChild && !mayHaveSession() && !isGoogleReturn()) {
  // Let the browser paint the prerendered page first; hydrating is a long task that would otherwise
  // run before the first paint.
  requestAnimationFrame(() => setTimeout(() => hydrateRoot(container, app)))
} else {
  container.replaceChildren()
  delete document.documentElement.dataset.restoring
  createRoot(container).render(app)
}
