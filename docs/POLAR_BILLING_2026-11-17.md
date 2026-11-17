# Polar.sh billing (web Pro subscriptions), 2026-11-17

Polar is the merchant of record for web subscriptions. Mobile purchases still go through RevenueCat. Both write the same `entitlements` row.

## Price (research 2026-11-17)
- **Pro: SAR 39 / month or SAR 349 / year** (yearly = 25% off). No second tier until Phase 2 is generally available (then "Business", about SAR 79–99).
- Competitor entry tiers: Zoho Books Standard 69, Wafeq Starter 99, Daftra Basic about 112, Qoyod Basic about 207 SAR/month. Zoho Invoice is free.
- Polar can charge in SAR (buyer location). Add a USD fallback of $10.40 / $93 (= 39 / 349 SAR at 3.75).
- Fees (Starter): 5% + $0.50, plus 1.5% for non-US cards. The yearly plan loses much less to fees.
- Cards, Apple Pay and Google Pay are supported. **mada-only cards are not.**
- Saudi VAT: in the sandbox checkout with country Saudi Arabia, Polar showed "Taxes (included) SAR 5.09" on SAR 39 (15% inside the price, the buyer still pays 39). Confirm the same on the live account before saying "VAT included" on the pricing card.

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

## Sandbox (set up 2026-11-17)
- Organization: **Qaftr** (slug `qaftr`) on sandbox.polar.sh, default currency SAR.
- Products: Monthly `c33edfd1-988e-427d-8182-12754ed557ed`, Yearly `57ea8b21-949c-4ffc-9b01-787f17294e0d`.
- Webhook "Qaftr local test (tunnel)": Raw, API version 2026-10, the 6 subscription events. Its URL is a Cloudflare quick tunnel, which changes on every run; edit the URL in Polar after restarting the tunnel.
- Access token `qaftr-local-sandbox` (expires 2026-12-17). Token and webhook secret are only in `invoice-app/.env`.
- Local test run:
  1. `cloudflared tunnel --url http://localhost:3123`
  2. `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS=.trycloudflare.com CLOUDFLARE_INCLUDE_PROCESS_ENV=true node node_modules/vite/bin/vite.js dev --port 3123 --strictPort`
  3. Pay with test card 4242 4242 4242 4242, any future expiry, any CVC.
- Result 2026-11-17: checkout opened in SAR, payment went through, the 3 webhooks returned 200, Pro switched on, renewal date showed, Manage subscription opened the portal, and cancelling there kept Pro until the period end.
- Polar rejects a pre-filled email whose domain can't receive mail. Checkout then retries without the email and the buyer types one on Polar's page.
- New webhook secrets look like `whsec_…`. The verifier accepts both the raw-string key (Polar SDK) and the base64 key after `whsec_` (Standard Webhooks).

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
