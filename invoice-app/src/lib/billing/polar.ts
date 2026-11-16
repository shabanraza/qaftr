/**
 * Polar.sh billing: pure helpers (no I/O) so they can be unit tested.
 * Polar is the merchant of record; it sends subscription webhooks signed with
 * the Standard Webhooks scheme, and we map them onto the `entitlements` row.
 */

export const POLAR_API_BASE = {
  production: 'https://api.polar.sh',
  sandbox: 'https://sandbox-api.polar.sh',
} as const

export type PolarServer = keyof typeof POLAR_API_BASE

/** Anything other than an explicit "production" talks to the sandbox. */
export function polarApiBase(server: string | undefined): string {
  return server === 'production' ? POLAR_API_BASE.production : POLAR_API_BASE.sandbox
}

const TOLERANCE_SECONDS = 5 * 60

function toBase64(bytes: ArrayBuffer): string {
  let s = ''
  for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b)
  return btoa(s)
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

/**
 * Verifies a Polar webhook (Standard Webhooks). Polar signs with the webhook
 * secret's raw UTF-8 bytes as the HMAC-SHA256 key over `${id}.${timestamp}.${body}`.
 */
export async function verifyPolarWebhook(
  body: string,
  headers: Headers,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): Promise<boolean> {
  const id = headers.get('webhook-id')
  const timestamp = headers.get('webhook-timestamp')
  const signatures = headers.get('webhook-signature')
  if (!id || !timestamp || !signatures || !secret) return false

  const ts = Number(timestamp)
  if (!Number.isFinite(ts) || Math.abs(nowSeconds - ts) > TOLERANCE_SECONDS) return false

  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const expected = toBase64(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${id}.${timestamp}.${body}`)))

  return signatures
    .split(' ')
    .map((part) => part.split(',', 2))
    .some(([version, sig]) => version === 'v1' && typeof sig === 'string' && timingSafeEqual(sig, expected))
}

export type PolarEntitlement = {
  userId: string
  plan: 'free' | 'pro'
  status: 'active' | 'expired'
  customerId: string | null
  subscriptionId: string
  currentPeriodEnd: Date | null
  changedAt: Date | null
}

type PolarEvent = { type?: string; data?: Record<string, unknown> }

const SUBSCRIPTION_EVENTS = new Set([
  'subscription.created',
  'subscription.active',
  'subscription.updated',
  'subscription.canceled',
  'subscription.uncanceled',
  'subscription.revoked',
])

/** Statuses that keep Pro. past_due = Polar is still retrying the renewal payment. */
const PRO_STATUSES = new Set(['active', 'trialing', 'past_due'])
/** Statuses that end Pro. */
const ENDED_STATUSES = new Set(['canceled', 'unpaid', 'incomplete_expired'])

function str(v: unknown): string | null {
  return typeof v === 'string' && v.length > 0 ? v : null
}

function date(v: unknown): Date | null {
  const s = str(v)
  if (!s) return null
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? null : d
}

/**
 * Maps a Polar webhook event to an entitlement change, or null to ignore it.
 * When `allowedProductIds` is given, subscriptions to any other product are ignored.
 */
export function resolvePolarEntitlement(event: PolarEvent, allowedProductIds?: readonly string[]): PolarEntitlement | null {
  if (!event.type || !SUBSCRIPTION_EVENTS.has(event.type) || !event.data) return null
  const data = event.data
  const subscriptionId = str(data.id)
  if (!subscriptionId) return null
  if (allowedProductIds) {
    const productId = str(data.product_id)
    if (!productId || !allowedProductIds.includes(productId)) return null
  }

  const customer = (data.customer ?? {}) as Record<string, unknown>
  const metadata = (data.metadata ?? {}) as Record<string, unknown>
  const userId = str(customer.external_id) ?? str(metadata.userId)
  if (!userId) return null

  const status = str(data.status) ?? ''
  let plan: PolarEntitlement['plan']
  if (event.type === 'subscription.revoked' || ENDED_STATUSES.has(status)) plan = 'free'
  else if (PRO_STATUSES.has(status)) plan = 'pro'
  else return null // e.g. "incomplete": checkout not paid yet

  return {
    userId,
    plan,
    status: plan === 'pro' ? 'active' : 'expired',
    customerId: str(data.customer_id) ?? str(customer.id),
    subscriptionId,
    currentPeriodEnd: date(data.current_period_end),
    changedAt: date(data.modified_at) ?? date(data.created_at),
  }
}

export type CheckoutInput = {
  productId: string
  userId: string
  email: string | null
  successUrl: string
  /** Buyer IP (CF-Connecting-IP). Without it Polar sees the Worker's IP and may pick the wrong currency. */
  customerIp?: string | null
}

/** Body for POST /v1/checkouts/. The checkout is tied to our user id. */
export function buildCheckoutBody({ productId, userId, email, successUrl, customerIp }: CheckoutInput) {
  return {
    products: [productId],
    external_customer_id: userId,
    ...(email ? { customer_email: email } : {}),
    success_url: successUrl,
    ...(customerIp ? { customer_ip_address: customerIp } : {}),
    metadata: { userId },
  }
}

type StoredPolarState = { polarSubscriptionId: string | null; polarChangedAt: Date | null }

/**
 * Guards against out-of-order webhooks. A change is applied unless it is older
 * than the last Polar change for the same subscription, or it would end Pro
 * because of a different (older) subscription.
 */
export function shouldApplyPolarChange(
  row: StoredPolarState | null,
  change: Pick<PolarEntitlement, 'plan' | 'subscriptionId' | 'changedAt'>,
): boolean {
  if (!row) return true
  const sameSubscription = row.polarSubscriptionId === change.subscriptionId
  if (change.plan === 'free' && row.polarSubscriptionId && !sameSubscription) return false
  if (sameSubscription && row.polarChangedAt && change.changedAt && change.changedAt < row.polarChangedAt) return false
  return true
}

/**
 * Pro can come from the web (Polar) or the app stores (RevenueCat). Each source
 * keeps its own flag on the row; the plan is Pro while either one is active, so
 * one source ending never removes Pro the other is still paying for.
 */
export function combinedPlan(sources: { polarPro: boolean; storePro: boolean }) {
  return sources.polarPro || sources.storePro
    ? ({ plan: 'pro', status: 'active' } as const)
    : ({ plan: 'free', status: 'expired' } as const)
}
