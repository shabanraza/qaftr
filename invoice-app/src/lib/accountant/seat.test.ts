// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { getTableConfig } from 'drizzle-orm/pg-core'
import { businessMembers } from '#/db/schema'
import {
  INVITE_TTL_DAYS,
  acceptDecision,
  canAccountantRead,
  hashInviteToken,
  inviteState,
  newInviteToken,
  normalizeEmail,
} from './seat'

const NOW = new Date('2026-11-16T10:00:00Z')
const days = (n: number) => new Date(NOW.getTime() + n * 86_400_000)

const pending = {
  status: 'pending' as const,
  accountantUserId: null,
  expiresAt: days(5),
}
const active = { status: 'active' as const, accountantUserId: 'acc-1', expiresAt: days(5) }

describe('business_members schema', () => {
  const cfg = getTableConfig(businessMembers)
  const col = (n: string) => cfg.columns.find((c) => c.name === n)

  it('links a business to an accountant and stores only a hash of the invite token', () => {
    const names = cfg.columns.map((c) => c.name)
    for (const n of ['id', 'business_id', 'accountant_user_id', 'email', 'status', 'token_hash', 'expires_at', 'accepted_at', 'revoked_at']) {
      expect(names).toContain(n)
    }
    expect(names).not.toContain('token')
    expect(col('business_id')?.notNull).toBe(true)
    expect(col('token_hash')?.notNull).toBe(true)
  })

  it('deletes memberships with the business or the accountant, and makes tokens unique', () => {
    const fk = (c: string) => cfg.foreignKeys.find((f) => f.reference().columns.some((x) => x.name === c))
    expect(fk('business_id')?.onDelete).toBe('cascade')
    expect(fk('accountant_user_id')?.onDelete).toBe('cascade')
    expect(cfg.indexes.some((i) => i.config.unique && i.config.columns.some((c) => 'name' in c && c.name === 'token_hash'))).toBe(true)
  })
})

describe('invite tokens', () => {
  it('creates a url-safe random token and a stable sha-256 hash of it', async () => {
    const a = await newInviteToken()
    const b = await newInviteToken()
    expect(a.token).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(a.token).not.toBe(b.token)
    expect(a.hash).toMatch(/^[0-9a-f]{64}$/)
    expect(await hashInviteToken(a.token)).toBe(a.hash)
    expect(a.hash).not.toContain(a.token)
  })

  it('normalises invitee emails', () => {
    expect(normalizeEmail('  Accountant@Firm.SA ')).toBe('accountant@firm.sa')
  })
})

describe('inviteState', () => {
  it('reports pending, active, expired and revoked', () => {
    expect(inviteState(pending, NOW)).toBe('pending')
    expect(inviteState(active, NOW)).toBe('active')
    expect(inviteState({ ...pending, expiresAt: days(-1) }, NOW)).toBe('expired')
    expect(inviteState({ ...active, status: 'revoked' }, NOW)).toBe('revoked')
  })

  it('does not expire an accepted membership', () => {
    expect(inviteState({ ...active, expiresAt: days(-30) }, NOW)).toBe('active')
  })

  it('gives invites a two-week life', () => {
    expect(INVITE_TTL_DAYS).toBe(14)
  })
})

describe('acceptDecision', () => {
  const ctx = { userId: 'acc-1', ownerId: 'owner-1', now: NOW }

  it('lets a signed-in accountant accept a pending invite', () => {
    expect(acceptDecision({ row: pending, ...ctx })).toEqual({ ok: true })
  })

  it('rejects unknown, expired, revoked and already-used invites', () => {
    expect(acceptDecision({ row: null, ...ctx })).toEqual({ ok: false, reason: 'not_found' })
    expect(acceptDecision({ row: { ...pending, expiresAt: days(-1) }, ...ctx })).toEqual({ ok: false, reason: 'expired' })
    expect(acceptDecision({ row: { ...pending, status: 'revoked' }, ...ctx })).toEqual({ ok: false, reason: 'revoked' })
    expect(acceptDecision({ row: active, ...ctx })).toEqual({ ok: false, reason: 'already_used' })
  })

  it('does not let an owner become the accountant of their own business', () => {
    expect(acceptDecision({ row: pending, ...ctx, userId: 'owner-1' })).toEqual({ ok: false, reason: 'own_business' })
  })
})

describe('canAccountantRead', () => {
  it('allows only the active accountant who accepted', () => {
    expect(canAccountantRead(active, 'acc-1')).toBe(true)
    expect(canAccountantRead(active, 'someone-else')).toBe(false)
    expect(canAccountantRead({ ...active, status: 'revoked' }, 'acc-1')).toBe(false)
    expect(canAccountantRead(pending, 'acc-1')).toBe(false)
  })
})
