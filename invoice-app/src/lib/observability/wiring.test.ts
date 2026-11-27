// The app's entry points must actually call the reporters.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it, vi } from 'vitest'

// The real route tree pulls in Worker-only modules; an empty one is enough here.
vi.mock('../../routeTree.gen', async () => {
  const { createRootRoute } = await import('@tanstack/react-router')
  return { routeTree: createRootRoute() }
})
const capture = vi.hoisted(() => vi.fn())
const start = vi.hoisted(() => vi.fn(async () => {}))
vi.mock('#/lib/observability/browser', () => ({
  captureBrowserError: capture,
  startBrowserErrorReporting: start,
}))

const source = (path: string) => readFileSync(resolve(process.cwd(), 'src', path), 'utf8')

describe('error reporting wiring', () => {
  it('starts in the browser and reports errors caught by route boundaries', async () => {
    const { getRouter } = await import('#/router')
    const router = getRouter()
    expect(start).toHaveBeenCalled()
    const error = new Error('render failed')
    router.options.defaultOnCatch?.(error, { componentStack: '' })
    expect(capture).toHaveBeenCalledWith(error)
  })

  it('wraps the Worker handlers, the SSR render and the cron sweep', () => {
    const server = source('server.ts')
    expect(server).toContain('withSentry(serverSentryOptions')
    expect(server).toContain('captureRouteErrors(')
    expect(server).toContain("captureServerError(e, 'cron')")
  })

  // TanStack Start answers a thrown error with a 500 before the Worker wrapper
  // sees it, so a global request middleware reports it.
  it('reports API route errors through a global request middleware', () => {
    const startFile = source('start.ts')
    expect(startFile).toContain('reportRequestErrors(pathname, next)')
    expect(startFile).toContain('requestMiddleware: [errorReporting, csrf]')
    expect(startFile).toContain('reportServerFnErrors(next)')
    expect(startFile).toContain('functionMiddleware: [serverFnErrorReporting]')
  })

  // A custom start.ts replaces TanStack's default CSRF protection, so it must
  // add the same one back.
  it('keeps CSRF protection on server functions', () => {
    expect(source('start.ts')).toMatch(
      /createCsrfMiddleware\(\{\s*filter: \(ctx\) => ctx\.handlerType === 'serverFn',?\s*\}\)/,
    )
  })
})
