/**
 * Worker entry: TanStack Start's request handler plus the cron trigger that
 * resends signed invoices ZATCA has not accepted yet (lib/zatca/resubmit.ts).
 * Both are wrapped for error reporting (off without a Sentry DSN).
 */
import { withSentry } from '@sentry/cloudflare'
import {
  createStartHandler,
  defaultStreamHandler,
} from '@tanstack/react-start/server'
import {
  captureRouteErrors,
  captureServerError,
  serverSentryOptions,
} from '#/lib/observability/server'
import { resolveZatcaEnv } from '#/lib/zatca/egs-records'
import { runZatcaSweep } from '#/lib/zatca/resubmit'
import { r2XmlStore } from '#/lib/zatca/xml-store'

const startHandler = createStartHandler((ctx) => {
  captureRouteErrors(ctx.router.state.matches)
  return defaultStreamHandler(ctx)
})

interface ScheduledContext {
  waitUntil(promise: Promise<unknown>): void
}

async function scheduledSweep(): Promise<void> {
  const env = resolveZatcaEnv(process.env)
  if (!env) return
  await runZatcaSweep({ env, store: await r2XmlStore() })
}

const worker = {
  fetch: (request: Request) => startHandler(request),
  scheduled(_controller: unknown, _env: unknown, ctx: ScheduledContext) {
    ctx.waitUntil(
      scheduledSweep().catch((e: unknown) => {
        captureServerError(e, 'cron')
        console.error('[zatca] sweep crashed', (e as Error).message)
      }),
    )
  },
}

// `never`: withSentry is typed for Cloudflare's handler shape, which this satisfies.
export default withSentry(serverSentryOptions, worker as never)
