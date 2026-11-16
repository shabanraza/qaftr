import { eq } from 'drizzle-orm'
import { db } from '#/db'
import { entitlements } from '#/db/schema'
import { buildCheckoutBody, polarApiBase, shouldApplyPolarChange } from './polar'
import type { CheckoutInput, PolarEntitlement } from './polar'

export type BillingInterval = 'monthly' | 'yearly'

export type PolarConfig = {
  apiBase: string
  accessToken: string
  products: Record<BillingInterval, string>
}

/** Reads Polar settings from the environment, or null when billing is not configured. */
export function getPolarConfig(env: Record<string, string | undefined> = process.env): PolarConfig | null {
  const accessToken = env.POLAR_ACCESS_TOKEN
  const monthly = env.POLAR_PRODUCT_PRO_MONTHLY
  const yearly = env.POLAR_PRODUCT_PRO_YEARLY
  if (!accessToken || !monthly || !yearly) return null
  return { apiBase: polarApiBase(env.POLAR_SERVER), accessToken, products: { monthly, yearly } }
}

async function polarPost<T>(config: PolarConfig, path: string, body: unknown): Promise<T> {
  const res = await fetch(`${config.apiBase}${path}`, {
    method: 'POST',
    headers: { authorization: `Bearer ${config.accessToken}`, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    // Log status and Polar's error body (no secrets in either), then fail generically.
    console.error('[polar]', path, res.status, (await res.text()).slice(0, 500))
    throw new Error('BILLING_FAILED')
  }
  return (await res.json()) as T
}

export async function createPolarCheckout(config: PolarConfig, input: Omit<CheckoutInput, 'productId'> & { interval: BillingInterval }) {
  const { interval, ...rest } = input
  const checkout = await polarPost<{ url: string }>(config, '/v1/checkouts/', buildCheckoutBody({ ...rest, productId: config.products[interval] }))
  return checkout.url
}

/** A short-lived link to Polar's customer portal (cancel, change card, invoices). */
export async function createPolarPortalUrl(config: PolarConfig, userId: string) {
  const session = await polarPost<{ customer_portal_url: string }>(config, '/v1/customer-sessions/', { external_customer_id: userId })
  return session.customer_portal_url
}

/** Writes a Polar subscription change onto the user's entitlement row. */
export async function applyPolarEntitlement(change: PolarEntitlement): Promise<boolean> {
  const [row] = await db
    .select({ polarSubscriptionId: entitlements.polarSubscriptionId, polarChangedAt: entitlements.polarChangedAt })
    .from(entitlements)
    .where(eq(entitlements.ownerId, change.userId))
    .limit(1)
  if (!shouldApplyPolarChange(row ?? null, change)) return false

  const values = {
    plan: change.plan,
    status: change.status,
    polarCustomerId: change.customerId,
    polarSubscriptionId: change.subscriptionId,
    currentPeriodEnd: change.currentPeriodEnd,
    polarChangedAt: change.changedAt,
    updatedAt: new Date(),
  }
  await db
    .insert(entitlements)
    .values({ ownerId: change.userId, ...values })
    .onConflictDoUpdate({ target: entitlements.ownerId, set: values })
  return true
}
