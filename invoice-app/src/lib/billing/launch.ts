/**
 * Web Pro checkout switch. Polar approved the account on 2026-11-19, so live
 * checkout is open. Set to false to close it again: the home Pro card and the
 * billing page then show disabled buttons and billing.checkout refuses.
 * Webhooks and the customer portal keep working either way.
 */
export const PRO_CHECKOUT_OPEN = true
