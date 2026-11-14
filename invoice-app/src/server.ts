/**
 * Worker entry: TanStack Start's request handler plus the cron trigger that
 * resends signed invoices ZATCA has not accepted yet (lib/zatca/resubmit.ts).
 */
import handler from '@tanstack/react-start/server-entry'
import { resolveZatcaEnv } from '#/lib/zatca/egs-records'
import { runZatcaSweep } from '#/lib/zatca/resubmit'
import { r2XmlStore } from '#/lib/zatca/xml-store'

interface ScheduledContext {
  waitUntil(promise: Promise<unknown>): void
}

async function scheduledSweep(): Promise<void> {
  const env = resolveZatcaEnv(process.env)
  if (!env) return
  await runZatcaSweep({ env, store: await r2XmlStore() })
}

export default {
  fetch: handler.fetch,
  scheduled(_controller: unknown, _env: unknown, ctx: ScheduledContext) {
    ctx.waitUntil(
      scheduledSweep().catch((e: unknown) => console.error('[zatca] sweep crashed', (e as Error).message)),
    )
  },
}
