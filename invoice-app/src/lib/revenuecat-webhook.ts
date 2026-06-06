import { db } from '#/db'
import { entitlements } from '#/db/schema'
import {
  resolveEntitlementUpdate,
  type EntitlementUpdate,
  type RevenueCatWebhookEvent,
} from '#/lib/revenuecat-entitlements'

export type { RevenueCatWebhookEvent } from '#/lib/revenuecat-entitlements'
export { resolveEntitlementUpdate } from '#/lib/revenuecat-entitlements'

async function upsertEntitlement(userId: string, update: EntitlementUpdate) {
  await db
    .insert(entitlements)
    .values({
      ownerId: userId,
      plan: update.plan,
      status: update.status,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: entitlements.ownerId,
      set: {
        plan: update.plan,
        status: update.status,
        updatedAt: new Date(),
      },
    })
}

/** @returns true when an entitlement row was written, false when the event was ignored. */
export async function applyRevenueCatEvent(event: RevenueCatWebhookEvent): Promise<boolean> {
  const update = resolveEntitlementUpdate(event)
  if (!update) return false

  await upsertEntitlement(event.app_user_id, update)
  return true
}
