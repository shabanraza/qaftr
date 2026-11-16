# Polar.sh billing (web Pro subscriptions), 2026-11-17

Polar is the merchant of record for web subscriptions. Mobile purchases still go through RevenueCat. Both write the same `entitlements` row.

## Price (research 2026-11-17)
- **Pro: SAR 39 / month or SAR 349 / year** (yearly = 25% off). No second tier until Phase 2 is generally available (then "Business", about SAR 79–99).
- Competitor entry tiers: Zoho Books Standard 69, Wafeq Starter 99, Daftra Basic about 112, Qoyod Basic about 207 SAR/month. Zoho Invoice is free.
- Polar can charge in SAR (buyer location). Add a USD fallback of $10.40 / $93 (= 39 / 349 SAR at 3.75).
- Fees (Starter): 5% + $0.50, plus 1.5% for non-US cards. The yearly plan loses much less to fees.
- Cards, Apple Pay and Google Pay are supported. **mada-only cards are not.**
- Open item: confirm with Polar support that Saudi VAT is collected on consumer sales before saying "VAT included" on the pricing card.

## Polar setup (per environment: sandbox.polar.sh for testing, polar.sh for live)
1. Create an organization (Qaftr). Live only: finish account review and payouts (Stripe Connect; Saudi Arabia is supported).
2. Create 2 recurring products:
   - "Qaftr Pro — Monthly": SAR 39 / month, USD fallback $10.40
   - "Qaftr Pro — Yearly": SAR 349 / year, USD fallback $93
3. Add a webhook endpoint:
   - URL: `https://qaftr.com/api/webhooks/polar` (sandbox: a tunnel or staging URL)
   - Format: Raw
   - Events: `subscription.created`, `subscription.active`, `subscription.updated`, `subscription.canceled`, `subscription.uncanceled`, `subscription.revoked`
4. In the organization settings, turn off multiple subscriptions per customer, so a double click can't create two subscriptions.
5. Create an organization access token with the scopes `checkouts:write`, `customer_sessions:write`, `products:read` and `subscriptions:read`.

## Worker settings
Set the secrets yourself; never paste them into chat:

```bash
npx wrangler secret put POLAR_ACCESS_TOKEN
npx wrangler secret put POLAR_WEBHOOK_SECRET
```

Plain variables (not secrets):
- `POLAR_SERVER` = `production` (anything else uses the sandbox)
- `POLAR_PRODUCT_PRO_MONTHLY` = product id
- `POLAR_PRODUCT_PRO_YEARLY` = product id

Until all of `POLAR_ACCESS_TOKEN` and both product ids are set, the plan page says web checkout is unavailable and points to support@qaftr.com.

For local dev, put the same keys in `invoice-app/.env` (sandbox values).

## How it works
- `/workspace/billing` → `billing.checkout` → Polar checkout. The checkout is tied to our user id (`external_customer_id`) and forwards `CF-Connecting-IP` so Polar picks SAR.
- Polar calls `/api/webhooks/polar`. Its signature is checked (Standard Webhooks, 5-minute window), then the subscription is mapped:
  - `active` / `trialing` / `past_due` → Pro
  - `revoked` / `canceled` / `unpaid` / `incomplete_expired` → Free
  - A cancel at period end stays Pro until Polar sends `revoked`.
  - Older or out-of-order events are ignored.
- "Manage subscription" opens Polar's customer portal (cancel, change card, receipts).
- Web (Polar) and app-store (RevenueCat) Pro are tracked separately (`polar_pro`, `store_pro`). The plan is Pro while either one is on, so one ending never removes Pro the other is still paying for.
- The out-of-order check runs inside the database write, so simultaneous webhooks can't race.
- Only the two configured Pro product ids grant Pro.
- Events for unknown users are acknowledged, so Polar stops retrying them.
- Migration `drizzle/0004_polar_billing.sql` adds `store_pro`, `polar_pro`, `polar_customer_id`, `polar_subscription_id`, `current_period_end` and `polar_changed_at` to `entitlements`. It also backfills `store_pro` for existing Pro rows.
