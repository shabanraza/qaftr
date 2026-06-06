export interface RevenueCatWebhookEvent {
  type: string
  app_user_id: string
  product_id?: string
  period_type?: string
  expiration_at_ms?: number
}

type Plan = 'free' | 'pro'
type EntitlementStatus = 'active' | 'expired' | 'cancelled'

export interface EntitlementUpdate {
  plan: Plan
  status: EntitlementStatus
}

const PRO_GRANT_EVENTS = new Set([
  'INITIAL_PURCHASE',
  'RENEWAL',
  'PRODUCT_CHANGE',
  'UNCANCELLATION',
  'NON_RENEWING_PURCHASE',
  'SUBSCRIPTION_EXTENDED',
])

const PRO_REVOKE_EVENTS = new Set(['EXPIRATION', 'BILLING_ISSUE'])

/** Pure mapping from RevenueCat event → entitlement update, or null to ignore. */
export function resolveEntitlementUpdate(
  event: RevenueCatWebhookEvent,
  nowMs = Date.now(),
): EntitlementUpdate | null {
  const eventType = event.type

  if (PRO_GRANT_EVENTS.has(eventType)) {
    return { plan: 'pro', status: 'active' }
  }

  if (PRO_REVOKE_EVENTS.has(eventType)) {
    return { plan: 'free', status: 'expired' }
  }

  if (eventType === 'CANCELLATION') {
    const expiresAt = event.expiration_at_ms
    if (expiresAt != null && expiresAt > nowMs) {
      return null
    }
    return { plan: 'free', status: 'expired' }
  }

  return null
}
