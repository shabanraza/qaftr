/**
 * Retry sweeper for signed invoices ZATCA has not accepted yet: simplified
 * invoices still `signed` (must be reported within 24 hours) and standard
 * invoices `pending_clearance`. Resends the stored XML; never re-signs.
 * Runs from the Worker's cron trigger (src/server.ts).
 */
import type { ZatcaIssueStatus } from './issue'

export interface SweepCandidate {
  invoiceId: string
  egsUnitId: string
  status: 'signed' | 'pending_clearance'
  /** Submissions so far (zatca_submissions rows). */
  attempts: number
  lastAttemptAt: Date | null
  reportDueAt: Date | null
}

export interface SweepSummary {
  attempted: number
  /** Reported or cleared (with or without warnings), or rejected: no longer pending. */
  done: number
  stillPending: number
  skipped: number
  failed: number
  /** Still pending after the 24-hour reporting deadline. */
  overdue: number
}

const MIN = 60_000
const BASE_BACKOFF = 5 * MIN
const MAX_BACKOFF = 120 * MIN
/** Last-chance attempt this long before the reporting deadline. */
const DEADLINE_MARGIN = 15 * MIN

/** When the next retry may run; null = now. */
export function nextAttemptAt(c: SweepCandidate): Date | null {
  if (!c.lastAttemptAt || c.attempts === 0) return null
  const backoff = Math.min(BASE_BACKOFF * 2 ** Math.max(0, c.attempts - 1), MAX_BACKOFF)
  let at = c.lastAttemptAt.getTime() + backoff
  if (c.reportDueAt) at = Math.min(at, c.reportDueAt.getTime() - DEADLINE_MARGIN)
  return new Date(at)
}

const PENDING = new Set<ZatcaIssueStatus>(['signed', 'pending_clearance'])

export async function sweepPending(p: {
  candidates: SweepCandidate[]
  now: Date
  submit: (c: SweepCandidate, attempt: number) => Promise<ZatcaIssueStatus>
  limit?: number
}): Promise<SweepSummary> {
  const summary: SweepSummary = { attempted: 0, done: 0, stillPending: 0, skipped: 0, failed: 0, overdue: 0 }
  const limit = p.limit ?? 50
  const due = (c: SweepCandidate) => c.reportDueAt?.getTime() ?? Number.MAX_SAFE_INTEGER
  const ordered = [...p.candidates].sort((a, b) => due(a) - due(b))

  for (const c of ordered) {
    const next = nextAttemptAt(c)
    if (next && next > p.now) {
      summary.skipped += 1
      continue
    }
    if (summary.attempted >= limit) break
    summary.attempted += 1
    let status: ZatcaIssueStatus | null = null
    try {
      status = await p.submit(c, c.attempts + 1)
    } catch (e) {
      summary.failed += 1
      console.error('[zatca] sweep submit failed', { invoiceId: c.invoiceId, error: (e as Error).message })
    }
    if (status && !PENDING.has(status)) {
      summary.done += 1
    } else {
      if (status) summary.stillPending += 1
      if (c.reportDueAt && c.reportDueAt <= p.now) summary.overdue += 1
    }
  }
  return summary
}
