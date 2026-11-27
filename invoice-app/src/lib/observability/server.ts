/**
 * Worker error reporting. server.ts wraps the handlers with `withSentry` using
 * these options; the capture helpers do nothing while Sentry is off.
 */
import {
  captureException,
  dedupeIntegration,
  eventFiltersIntegration,
  functionToStringIntegration,
  linkedErrorsIntegration,
  requestDataIntegration,
} from '@sentry/cloudflare'
import type { CloudflareOptions } from '@sentry/cloudflare'
import { isNotFound } from '@tanstack/react-router'
import { sanitizeClientMessage } from '#/integrations/trpc/errors'
import { buildRelease, resolveSentryConfig, sharedSentryOptions } from './options'
import type { SentryEnvInput } from './options'

function readBuildEnv(): SentryEnvInput {
  return {
    dsn: import.meta.env.VITE_SENTRY_DSN as string | undefined,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT as string | undefined,
    release: buildRelease(),
    isDev: import.meta.env.DEV,
    mode: import.meta.env.MODE,
  }
}

/** Worker variables (`SENTRY_DSN`, `SENTRY_ENVIRONMENT`) override the build. */
export function serverSentryOptions(
  env: unknown,
  build: SentryEnvInput = readBuildEnv(),
): CloudflareOptions & { enabled: boolean } {
  const vars = (env ?? {}) as { SENTRY_DSN?: string; SENTRY_ENVIRONMENT?: string }
  const config = resolveSentryConfig({
    ...build,
    dsn: vars.SENTRY_DSN || build.dsn,
    environment: vars.SENTRY_ENVIRONMENT || build.environment,
  })
  // Explicit, so the SDK does not pick SENTRY_DSN up by itself.
  if (!config) return { enabled: false }
  return {
    ...sharedSentryOptions(config),
    enabled: true,
    // No fetch, HTTP server or console instrumentation. Request data is only
    // used for the method and path (scrub.ts drops the rest).
    integrations: [
      dedupeIntegration(),
      eventFiltersIntegration(),
      functionToStringIntegration(),
      linkedErrorsIntegration(),
      requestDataIntegration(),
    ],
  }
}

export function captureServerError(error: unknown, source: string): void {
  captureException(error, { tags: { source } })
}

/**
 * tRPC catches procedure errors itself. Report the unexpected ones; expected
 * business codes (free limit, invalid profile…) are not bugs.
 */
export function captureTrpcError({
  error,
  path,
}: {
  error: { code: string; message: string; cause?: unknown }
  path?: string
}): void {
  if (error.code !== 'INTERNAL_SERVER_ERROR') return
  const code = sanitizeClientMessage(error.message)
  if (code !== 'INTERNAL_ERROR' && !/_(FAILED|UNAVAILABLE)$/.test(code)) return
  captureException(error.cause ?? error, {
    tags: { source: 'trpc', trpc_path: path ?? 'unknown' },
  })
}

/** Loader errors during server rendering are turned into an error page. */
export function captureRouteErrors(
  matches: ReadonlyArray<{ status: string; error?: unknown }>,
): void {
  for (const match of matches) {
    if (match.status === 'error') captureServerError(match.error, 'ssr')
  }
}

/**
 * Global request middleware (src/start.ts). TanStack Start turns a thrown error
 * into a 500 response itself, so the Worker-level wrapper never sees it.
 */
export async function reportRequestErrors<R extends { response: Response }>(
  pathname: string,
  next: () => R | PromiseLike<R>,
): Promise<R> {
  let result: R
  try {
    result = await next()
  } catch (error) {
    // Redirects are thrown as responses.
    if (!(error instanceof Response)) captureServerError(error, 'request')
    throw error
  }
  // Better Auth and webhooks answer their own failures with a 5xx. tRPC, server
  // functions and page rendering report the error itself.
  if (/^\/api\/(?!trpc)/.test(pathname) && result.response.status >= 500) {
    const route = pathname.split('/').slice(0, 3).join('/')
    captureServerError(new Error(`${route} responded ${result.response.status}`), 'request')
  }
  return result
}

/**
 * Global server function middleware (src/start.ts). Server functions serialise a
 * thrown error into the response, so this is the only place with the original.
 */
export async function reportServerFnErrors<R>(next: () => R | PromiseLike<R>): Promise<R> {
  try {
    return await next()
  } catch (error) {
    // Redirects and not-found are control flow.
    if (!(error instanceof Response) && !isNotFound(error)) {
      captureServerError(error, 'server_fn')
    }
    throw error
  }
}
