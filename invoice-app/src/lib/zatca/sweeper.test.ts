// @vitest-environment node
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { nextAttemptAt, sweepPending } from './sweeper'
import type { SweepCandidate } from './sweeper'

const now = new Date('2026-11-14T12:00:00Z')
const min = 60_000

const cand = (over: Partial<SweepCandidate> = {}): SweepCandidate => ({
  invoiceId: 'inv-1',
  egsUnitId: 'egs-1',
  status: 'signed',
  attempts: 1,
  lastAttemptAt: new Date(now.getTime() - 60 * min),
  reportDueAt: new Date(now.getTime() + 10 * 60 * min),
  ...over,
})

describe('nextAttemptAt', () => {
  it('retries immediately when never attempted, then backs off 5, 10, 20… minutes up to 2 hours', () => {
    expect(nextAttemptAt(cand({ attempts: 0, lastAttemptAt: null }))).toBeNull()
    const last = new Date('2026-11-14T10:00:00Z')
    expect(nextAttemptAt(cand({ attempts: 1, lastAttemptAt: last }))).toEqual(new Date(last.getTime() + 5 * min))
    expect(nextAttemptAt(cand({ attempts: 3, lastAttemptAt: last }))).toEqual(new Date(last.getTime() + 20 * min))
    expect(nextAttemptAt(cand({ attempts: 12, lastAttemptAt: last }))).toEqual(new Date(last.getTime() + 120 * min))
  })

  it('never waits past the 24-hour reporting deadline', () => {
    const last = new Date('2026-11-14T11:00:00Z')
    const due = new Date('2026-11-14T11:30:00Z')
    expect(nextAttemptAt(cand({ attempts: 12, lastAttemptAt: last, reportDueAt: due }))).toEqual(new Date(due.getTime() - 90 * min))
  })
})

describe('hourly cron schedule', () => {
  // Hourly, not every few minutes: each run wakes the database, and Neon only
  // suspends it after 5 idle minutes.
  it('runs the sweep once an hour', () => {
    const wrangler = readFileSync('wrangler.jsonc', 'utf8')
    expect(wrangler).toContain('"crons": ["0 * * * *"]')
  })

  // Cron starts just after the hour; the attempt is recorded a moment later.
  const sec = 1000
  const runAt = (hour: string) => new Date(Date.parse(hour) + sec)

  it('retries after the 2-hour maximum backoff on the second hourly run, not the third', async () => {
    const r = await sweepPending({
      now: runAt('2026-11-14T12:00:00Z'),
      candidates: [cand({ attempts: 12, lastAttemptAt: new Date('2026-11-14T10:00:03Z'), reportDueAt: null })],
      submit: async () => 'signed',
    })
    expect(r.attempted).toBe(1)
  })

  it('always attempts between 95 and 30 minutes before the reporting deadline', async () => {
    for (let offset = 0; offset < 60; offset++) {
      const due = new Date(Date.parse('2026-11-14T20:00:00Z') + offset * min)
      const tries: number[] = []
      let c = cand({ attempts: 0, lastAttemptAt: null, reportDueAt: due })
      for (let h = 0; h < 24; h++) {
        const now = new Date(Date.parse('2026-11-14T00:00:01Z') + h * 60 * min)
        await sweepPending({
          now,
          candidates: [c],
          submit: async (_, attempt) => {
            const at = new Date(now.getTime() + 2 * sec)
            tries.push((due.getTime() - at.getTime()) / min)
            c = { ...c, attempts: attempt, lastAttemptAt: at }
            return 'signed'
          },
        })
      }
      expect(tries.some((before) => before >= 30 && before <= 95), `deadline ${due.toISOString()}`).toBe(true)
    }
  })
})

describe('sweepPending', () => {
  it('resubmits due invoices oldest deadline first and tallies the outcomes', async () => {
    const seen: string[] = []
    const r = await sweepPending({
      now,
      candidates: [
        cand({ invoiceId: 'late', reportDueAt: new Date(now.getTime() + 60 * min) }),
        cand({ invoiceId: 'waiting', attempts: 2, lastAttemptAt: new Date(now.getTime() - 2 * min) }),
        cand({ invoiceId: 'urgent', reportDueAt: new Date(now.getTime() + 5 * min) }),
        cand({ invoiceId: 'b2b', status: 'pending_clearance', reportDueAt: null }),
      ],
      submit: async (c, attempt) => {
        seen.push(`${c.invoiceId}#${attempt}`)
        return c.invoiceId === 'b2b' ? 'pending_clearance' : 'reported'
      },
    })
    expect(seen).toEqual(['urgent#2', 'late#2', 'b2b#2'])
    expect(r).toEqual({ attempted: 3, done: 2, stillPending: 1, skipped: 1, failed: 0, overdue: 0 })
  })

  it('keeps going when one invoice throws, and counts overdue ones', async () => {
    const r = await sweepPending({
      now,
      candidates: [
        cand({ invoiceId: 'boom' }),
        cand({ invoiceId: 'overdue', reportDueAt: new Date(now.getTime() - min) }),
      ],
      submit: async (c) => {
        if (c.invoiceId === 'boom') throw new Error('R2 down')
        return 'signed'
      },
    })
    expect(r).toMatchObject({ attempted: 2, failed: 1, stillPending: 1, overdue: 1 })
  })

  it('resends overdue invoices only after those that can still meet the deadline', async () => {
    const seen: string[] = []
    await sweepPending({
      now,
      candidates: [
        cand({ invoiceId: 'overdue', reportDueAt: new Date(now.getTime() - 60 * min) }),
        cand({ invoiceId: 'b2b', status: 'pending_clearance', reportDueAt: null }),
        cand({ invoiceId: 'due-soon', reportDueAt: new Date(now.getTime() + 30 * min) }),
      ],
      submit: async (c) => (seen.push(c.invoiceId), 'reported'),
    })
    expect(seen).toEqual(['due-soon', 'b2b', 'overdue'])
  })

  it('resends up to 150 invoices in one hourly run', async () => {
    const r = await sweepPending({
      now,
      candidates: Array.from({ length: 160 }, (_, i) => cand({ invoiceId: `i${i}` })),
      submit: async () => 'reported',
    })
    expect(r.attempted).toBe(150)
  })

  it('stops at the per-run limit', async () => {
    let n = 0
    const r = await sweepPending({
      now,
      limit: 2,
      candidates: [cand({ invoiceId: 'a' }), cand({ invoiceId: 'b' }), cand({ invoiceId: 'c' })],
      submit: async () => (n++, 'reported'),
    })
    expect(n).toBe(2)
    expect(r.attempted).toBe(2)
  })
})
