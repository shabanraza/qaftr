import { sql } from 'drizzle-orm'
import { db } from '#/db'
import { entitlements } from '#/db/schema'
import { buildCheckoutBody, combinedPlan, polarApiBase } from './polar'
import type { CheckoutInput, PolarEntitlement } from './polar'

export type BillingInterval = 'monthly' | 'yearly'

export type PolarConfig = {
  apiBase: string
  accessToken: string
  products: Record<BillingInterval, string>
}

/** The configured Pro product ids (webhooks for other products are ignored). */
export function polarProductIds(env: Record<string, string | undefined> = process.env): string[] {
  return [env.POLAR_PRODUCT_PRO_MONTHLY, env.POLAR_PRODUCT_PRO_YEARLY].filter((v): v is string => Boolean(v))
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

/** Plan/status from both per-source flags, evaluated in SQL on conflict. */
const COMBINED_PLAN = sql`case when excluded.polar_pro or ${entitlements.storePro} then 'pro'::plan else 'free'::plan end`
const COMBINED_STATUS = sql`case when excluded.polar_pro or ${entitlements.storePro} then 'active'::entitlement_status else 'expired'::entitlement_status end`

/**
 * Writes a Polar subscription change onto the user's entitlement row. The
 * stale/out-of-order guard (see shouldApplyPolarChange) runs inside the upsert,
 * so two webhooks arriving together cannot apply in the wrong order.
 * @returns false when the event was ignored or the user no longer exists.
 */
export async function applyPolarEntitlement(change: PolarEntitlement): Promise<boolean> {
  const polarPro = change.plan === 'pro'
  const values = {
    polarPro,
    polarCustomerId: change.customerId,
    polarSubscriptionId: change.subscriptionId,
    currentPeriodEnd: change.currentPeriodEnd,
    polarChangedAt: change.changedAt,
    updatedAt: new Date(),
  }
  const t = entitlements
  try {
    const rows = await db
      .insert(t)
      .values({ ownerId: change.userId, ...values, ...combinedPlan({ polarPro, storePro: false }) })
      .onConflictDoUpdate({
        target: t.ownerId,
        set: { ...values, plan: COMBINED_PLAN, status: COMBINED_STATUS },
        setWhere: sql`not (
            excluded.polar_pro = false
            and ${t.polarSubscriptionId} is not null
            and ${t.polarSubscriptionId} <> excluded.polar_subscription_id
          )
          and not (
            ${t.polarSubscriptionId} = excluded.polar_subscription_id
            and ${t.polarChangedAt} is not null
            and excluded.polar_changed_at is not null
            and excluded.polar_changed_at < ${t.polarChangedAt}
          )`,
      })
      .returning({ ownerId: t.ownerId })
    return rows.length > 0
  } catch (err) {
    // Unknown user (deleted account, or a sandbox customer): acknowledge so Polar stops retrying.
    const e = err as { code?: string; cause?: { code?: string } }
    if (e?.code === '23503' || e?.cause?.code === '23503') {
      console.warn('[polar] webhook for unknown user ignored')
      return false
    }
    throw err
  }
}
