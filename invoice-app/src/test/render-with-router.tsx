import { render } from '@testing-library/react'
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRouter,
} from '@tanstack/react-router'
import type { ReactNode } from 'react'

/**
 * Renders UI inside a minimal TanStack router so <Link> works in tests.
 * `initialPath` (e.g. "/ae?lang=en") sets the router location.
 */
export function renderWithRouter(ui: ReactNode, initialPath = '/') {
  const rootRoute = createRootRoute({ component: () => <>{ui}</> })
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })
  return { router, ...render(<RouterProvider router={router} />) }
}
