/**
 * Web Pro checkout switch. Keep false until Polar's account review is done
 * (payout account connected, support email verified, review approved);
 * until then Polar keeps the organization in test mode and real cards fail.
 * While false: the home Pro card and the billing page show disabled buttons,
 * and billing.checkout refuses. Webhooks and the customer portal still work.
 */
export const PRO_CHECKOUT_OPEN = false
