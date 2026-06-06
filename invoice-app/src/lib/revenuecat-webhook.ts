import { db } from '#/db'
import { entitlements } from '#/db/schema'

export interface RevenueCatWebhookEvent {
  type: string
  app_user_id: string
  product_id?: string
  period_type?: string
  expiration_at_ms?: number
}

export async function applyRevenueCatEvent(event: RevenueCatWebhookEvent) {
  const userId = event.app_user_id
  const eventType = event.type

  const isPro =
    eventType === 'INITIAL_PURCHASE' ||
    eventType === 'RENEWAL' ||
    eventType === 'PRODUCT_CHANGE'

  const isExpired =
    eventType === 'EXPIRATION' ||
    eventType === 'CANCELLATION' ||
    eventType === 'BILLING_ISSUE'

  const plan = isPro ? ('pro' as const) : ('free' as const)
  const status = isExpired ? ('expired' as const) : ('active' as const)

  await db
    .insert(entitlements)
    .values({ ownerId: userId, plan, status, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: entitlements.ownerId,
      set: { plan, status, updatedAt: new Date() },
    })
}
