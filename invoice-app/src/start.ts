/**
 * TanStack Start global middleware: reports failed server requests
 * and server functions (lib/observability/server.ts).
 */
import {
  createCsrfMiddleware,
  createMiddleware,
  createStart,
} from '@tanstack/react-start'
import {
  reportRequestErrors,
  reportServerFnErrors,
} from '#/lib/observability/server'

const errorReporting = createMiddleware().server(({ next, pathname }) =>
  reportRequestErrors(pathname, next),
)

const serverFnErrorReporting = createMiddleware({ type: 'function' }).server(
  ({ next }) => reportServerFnErrors(next),
)

// Having this file turns off TanStack's default CSRF protection for server
// functions; this is the same protection, added back. Do not remove it.
const csrf = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === 'serverFn',
})

export const startInstance = createStart(() => ({
  requestMiddleware: [errorReporting, csrf],
  functionMiddleware: [serverFnErrorReporting],
}))
