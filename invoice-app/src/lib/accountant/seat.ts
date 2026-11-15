/**
 * Accountant seat rules. Pure functions: the tRPC router loads rows and
 * applies these, so access decisions are unit-tested without a database.
 */
export const INVITE_TTL_DAYS = 14

export type MemberStatus = 'pending' | 'active' | 'revoked'
export type InviteState = 'pending' | 'active' | 'expired' | 'revoked'

export type MemberLike = {
  status: MemberStatus
  accountantUserId: string | null
  expiresAt: Date
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

const toHex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')

export async function hashInviteToken(token: string): Promise<string> {
  return toHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token)))
}

/** A fresh 256-bit url-safe token. Show it once; store only `hash`. */
export async function newInviteToken(): Promise<{ token: string; hash: string }> {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  const token = btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return { token, hash: await hashInviteToken(token) }
}

export function inviteState(row: Pick<MemberLike, 'status' | 'expiresAt'>, now: Date): InviteState {
  if (row.status === 'revoked') return 'revoked'
  if (row.status === 'active') return 'active'
  return row.expiresAt.getTime() < now.getTime() ? 'expired' : 'pending'
}

export type AcceptResult =
  | { ok: true }
  | { ok: false; reason: 'not_found' | 'expired' | 'revoked' | 'already_used' | 'own_business' }

export function acceptDecision(input: {
  row: MemberLike | null
  userId: string
  ownerId?: string
  now: Date
}): AcceptResult {
  const { row, userId, ownerId, now } = input
  if (!row) return { ok: false, reason: 'not_found' }
  const state = inviteState(row, now)
  if (state === 'revoked') return { ok: false, reason: 'revoked' }
  if (state === 'active') return { ok: false, reason: 'already_used' }
  if (state === 'expired') return { ok: false, reason: 'expired' }
  if (ownerId && ownerId === userId) return { ok: false, reason: 'own_business' }
  return { ok: true }
}

/** Read access: only the accountant who accepted, while the membership is active. */
export function canAccountantRead(row: Pick<MemberLike, 'status' | 'accountantUserId'>, userId: string): boolean {
  return row.status === 'active' && row.accountantUserId === userId
}
