# قافتر (Qaftr) — App Store, Play Store & RevenueCat Setup

Step-by-step checklist to publish the mobile app and enable **Qaftr Pro** subscriptions.

**Pricing (locked in app):**
- Free: 3 invoices / month
- Pro monthly: **39 SAR**
- Pro annual: **349 SAR**

**Technical IDs (do not change after launch):**

| Item | Value |
|------|-------|
| iOS bundle ID | `com.qaftr.invoice` |
| Android package | `com.qaftr.invoice` |
| Expo slug | `qaftr` |
| URL scheme | `qaftr` |
| RevenueCat entitlement | `pro` |
| Product ID (monthly) | `qaftr_pro_monthly` |
| Product ID (annual) | `qaftr_pro_yearly` |

---

## 0. Name check (June 2026) — read before registering

Stores do **not** offer a live “is this name available?” checker like domain registrars. You search manually; Apple/Google review for confusion and trademarks at submit time.

### Critical conflict — same name, same category

| Asset | Status | Risk |
|-------|--------|------|
| **[fatorati.com](https://fatorati.com)** | Live Saudi ZATCA e-invoicing web platform branded **Fatorati** | **HIGH** — same product space as your app |
| Arabic branding on that site | Uses فاتورة / Fatorati invoicing copy | Trademark / confusion risk |

**Action:** Before using “Fatorati” publicly, check [SAIP trademark search](https://saip.gov.sa/en/) for registered marks. If fatorati.com is not yours, consider a **rebrand** or explicit differentiation (e.g. different name entirely — not just “Fatorati Mobile”).

### Play Store — similar names already listed

| App name | Package | Notes |
|----------|---------|-------|
| **Fatourati فاتورتي** | `com.BillingSites.fatourati` | **Exact Arabic name** — Algeria utility bills app (100K+ downloads) |
| **فاتورتي Fatoraty** | Consumer Protection Association | Receipt/warranty storage (not invoicing) |
| **Fatora: Invoice,Store,Cashier** | `io.fatora.fatora` | Similar spelling — invoicing/POS |
| **My Fatoorah - ماي فاتورة** | `com.myfatoorahgcc` | Payment gateway (GCC) |
| **Fatoorah App / POS** | Various | ZATCA-adjacent naming |
| **فواتيري - احسب فاتورتك** | — | Arabic “my invoices” variant |

Search: [Play Store “fatorati”](https://play.google.com/store/search?q=fatorati&c=apps) · [Play Store “فاتورتي”](https://play.google.com/store/search?q=%D9%81%D8%A7%D8%AA%D9%88%D8%B1%D8%AA%D9%8A&c=apps)

### App Store — no exact “Fatorati” invoice app found

- No app titled **Fatorati** for ZATCA invoicing was found in search.
- **Fatora** (`io.fatora.fatora`) exists — similar sound, different spelling.
- Web product **fatorati.com** may still block you on trademark/confusion grounds even without an iOS app.

### Technical IDs — likely still available

| ID | Checked | Result |
|----|---------|--------|
| `com.qaftr.invoice` | Public store search | **Not found** — likely free to register in Apple/Google consoles |
| Expo slug `qaftr` | Expo account only | Unique within your Expo org |

Bundle ID is reserved when **you** register it in App Store Connect / Play Console — first-come, first-served globally.

### Safer alternative names (if you rebrand)

| Name | Arabic | Why |
|------|--------|-----|
| **Fatoori** | فاتوري | Shorter, distinct from fatorati.com |
| **Mustafir** | مستفِر | Freelancer-focused, unique |
| **Fawtir** | فواتِر | Invoice plural, less collision |
| **Sarih** | صريح فاتورة | “Simple invoice” positioning |

If you rename, update: `app.json` name, store listing, `VITE_SITE_URL`, and product IDs (`fatorati_pro_*` → new prefix) **before** first store submit.

---

## 0b. Before you start

- [ ] Apple Developer account ($99/year) — [developer.apple.com](https://developer.apple.com)
- [ ] Google Play Console account ($25 one-time) — [play.google.com/console](https://play.google.com/console)
- [ ] RevenueCat account — [app.revenuecat.com](https://app.revenuecat.com)
- [ ] EAS account — `npx eas login`
- [x] **Name resolved** — Qaftr / قافتر (section 0)
- [ ] SAIP trademark search for **قافتر** / **Qaftr**
- [x] Domain **`qaftr.com`** registered (point to deployed `invoice-app`; API at `api.qaftr.com` if split)

### Name vs bundle ID (not like domains)

| | Globally unique? | Can change later? |
|---|------------------|-------------------|
| Bundle ID `com.qaftr.invoice` | **Yes** | **No** (after first publish) |
| Store display name "قافتر" | No | Yes (per release) |
| Domain `qaftr.com` | Yes (via registrar) | Yes |

---

## 1. Apple — App Store Connect

### 1.1 Create the app

1. App Store Connect → **Apps** → **+** → New App
2. Platform: iOS
3. Name: `قافتر فاتورة ضريبية` (or `Qaftr Invoice` — max 30 chars; see MARKETING.md)
4. Primary language: Arabic (Saudi Arabia) or English
5. Bundle ID: select **`com.qaftr.invoice`** (register in Certificates, Identifiers & Profiles first if missing)
6. SKU: `qaftr-ios` (internal only)

### 1.2 Subscriptions

1. App → **Subscriptions** → **+** Subscription Group  
   - Group name: `Qaftr Pro`
2. Add subscription **qaftr_pro_monthly**
   - Reference name: `Qaftr Pro Monthly`
   - Duration: 1 month
   - Price: **39 SAR** (Saudi Arabia tier)
3. Add subscription **qaftr_pro_yearly**
   - Reference name: `Qaftr Pro Annual`
   - Duration: 1 year
   - Price: **349 SAR**
4. Add localization (Arabic + English) for display name & description
5. Submit subscription metadata for review (can ship with app v1)

### 1.3 Sandbox testers

1. App Store Connect → **Users and Access** → **Sandbox** → **Testers**
2. Create a sandbox Apple ID (e.g. `qaftr-test@yourdomain.com`)
3. Use this account on a physical device for purchase testing

### 1.4 Agreements

- [ ] **Paid Applications Agreement** signed
- [ ] **Banking & tax** completed (required for paid apps / IAP)

---

## 2. Google — Play Console

### 2.1 Create the app

1. Play Console → **Create app**
2. App name: `قافتر` / `Qaftr`
3. Default language: Arabic (Saudi Arabia)
4. App / game: App
5. Free or paid: **Free** (subscriptions are IAP, not paid app)

### 2.2 Link package name

When you upload the first AAB, package must be **`com.qaftr.invoice`** (matches `mobile/app.json`).

### 2.3 Subscriptions

1. **Monetize** → **Products** → **Subscriptions** → **Create subscription**
2. Product ID: `qaftr_pro_monthly`
   - Base plan: monthly, **39 SAR**, Saudi Arabia
3. Product ID: `qaftr_pro_yearly`
   - Base plan: yearly, **349 SAR**, Saudi Arabia
4. Activate both after filling store listing requirements

### 2.4 License testers

1. **Setup** → **License testing**
2. Add Gmail accounts for internal purchase testing

### 2.5 Merchant account

- [ ] Payments profile + merchant account linked (required for subscriptions)

---

## 3. RevenueCat

### 3.1 Project & apps

1. Create project: **Qaftr**
2. Add **iOS app**
   - Bundle ID: `com.qaftr.invoice`
   - App Store Connect shared secret / App Store Connect API (follow RC wizard)
3. Add **Android app**
   - Package: `com.qaftr.invoice`
   - Service credentials JSON from Google Play (RC wizard)

### 3.2 Products

1. **Product catalog** → import or add:
   - `qaftr_pro_monthly` (iOS + Android)
   - `qaftr_pro_yearly` (iOS + Android)

### 3.3 Entitlement

1. **Entitlements** → create **`pro`**
2. Attach both products to `pro`

### 3.4 Offering

1. **Offerings** → **default** (current offering)
2. Add packages:
   - Monthly → `qaftr_pro_monthly`
   - Annual → `qaftr_pro_yearly`

### 3.5 API keys (mobile)

RevenueCat → Project → **API keys** → copy:

| Key | Env variable |
|-----|----------------|
| Apple public SDK key | `EXPO_PUBLIC_REVENUECAT_IOS_KEY` |
| Google public SDK key | `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` |

Add to `mobile/.env.local`:

```bash
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_xxxxxxxx
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_xxxxxxxx
```

### 3.6 Webhook (server — unlocks Pro in API)

RevenueCat sends events to your **REST** endpoint (not tRPC).

**URL:**

```
https://YOUR_API_DOMAIN/api/webhooks/revenuecat
```

Example production: `https://api.qaftr.com/api/webhooks/revenuecat`

**Setup:**

1. Generate a random secret (32+ chars):  
   `openssl rand -hex 32`
2. Add to `invoice-app/.env` / production secrets:  
   `REVENUECAT_WEBHOOK_SECRET=<that-secret>`
3. RevenueCat → **Integrations** → **Webhooks** → Add endpoint
   - URL: as above
   - Authorization header: `Bearer <REVENUECAT_WEBHOOK_SECRET>`
   - Events: enable purchase, renewal, cancellation, expiration

**Important:** `app_user_id` in RevenueCat must match your auth **user id** — the app calls `Purchases.logIn(user.id)` on sign-in.

---

## 4. EAS Build (required — Expo Go cannot run IAP)

From `mobile/`:

```bash
# One-time: link project
npx eas init

# Development build (sandbox purchases)
npx eas build --profile development --platform ios
npx eas build --profile development --platform android

# Production (store submit)
npx eas build --profile production --platform all
```

Install dev build on a physical device. **Simulator/emulator IAP is limited** — use real devices for purchase tests.

### Environment on EAS

Set secrets in EAS (or `eas.json` env per profile):

```bash
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value https://api.qaftr.com
eas secret:create --scope project --name EXPO_PUBLIC_REVENUECAT_IOS_KEY --value appl_xxx
eas secret:create --scope project --name EXPO_PUBLIC_REVENUECAT_ANDROID_KEY --value goog_xxx
```

---

## 5. Test purchases end-to-end

### iOS (Sandbox)

1. Install dev or TestFlight build
2. Sign out of real App Store on device → sign in with **sandbox** Apple ID
3. Open app → Settings → Subscription → Paywall
4. Subscribe (monthly or annual) — no real charge
5. Verify:
   - [ ] Paywall shows “Pro active” / unlimited invoices
   - [ ] RevenueCat dashboard shows active entitlement
   - [ ] Webhook fired → `entitlements` row in DB has `plan = pro`

### Android (License test)

1. Install internal testing build
2. Use license tester Gmail on device Play Store
3. Same paywall flow
4. Same verification checklist

### Restore purchases

1. Delete app → reinstall → sign in → Paywall → **Restore purchases**
2. Pro should return without new charge

---

## 6. Store listing checklist

### Both stores

- [ ] App icon 1024×1024 (no transparency on iOS)
- [ ] Screenshots (6.7" iPhone + Android phone) — Arabic UI shots
- [ ] Short description: ZATCA Phase 1 invoices for Saudi freelancers
- [ ] Privacy policy URL (required for subscriptions)
- [ ] Support email / URL
- [ ] Age rating questionnaire
- [ ] Export compliance (standard encryption → usually “No” for custom encryption)

### Suggested subtitle (iOS, 30 chars)

`فواتير زاتكا للمستقلين` or `ZATCA invoices for freelancers`

### Keywords (iOS)

`فاتورة,زاتكا,فوترة,مستقل,invoice,ZATCA,Saudi,VAT,QR`

---

## 7. Submit for review

### iOS

```bash
npx eas submit --platform ios --latest
```

- [ ] App Review notes: explain subscription (39 SAR/mo, 349 SAR/yr), free tier (3 invoices/mo)
- [ ] Provide sandbox test account in review notes

### Android

```bash
npx eas submit --platform android --latest
```

- [ ] Internal testing → closed testing → production (staged rollout recommended)

---

## 8. Post-launch

- [ ] Monitor RevenueCat → **Charts** for conversion
- [ ] Monitor webhook failures in server logs
- [ ] Set `VITE_SITE_URL` on invoice-app for landing canonical URL
- [ ] App Store / Play pricing: confirm SAR tiers match 39 / 349 after Apple/Google fee tables update

---

## Quick reference — env vars

### `mobile/.env.local`

```bash
EXPO_PUBLIC_API_URL=https://api.qaftr.com
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_xxx
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_xxx
```

### `invoice-app/.env` (production)

```bash
DATABASE_URL=...
REVENUECAT_WEBHOOK_SECRET=<random-secret>
VITE_SITE_URL=https://qaftr.com
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Paywall says “Purchases unlock after store release” | Missing RevenueCat keys or running in Expo Go — use EAS dev build |
| Purchase succeeds but still 3-invoice limit | Webhook not reaching server; check URL, Bearer secret, `app_user_id` = user id |
| “Product not found” | Product IDs mismatch between App Store / Play / RevenueCat / offering |
| iOS sandbox “Cannot connect to iTunes Store” | Use sandbox tester; sign out of production Apple ID |
| Android “Item unavailable” | Subscription not activated in Play Console; app not on testing track |

---

## Order of operations (recommended)

1. Register bundle ID / package name  
2. Create store subscription products (Apple + Google)  
3. Configure RevenueCat (products, entitlement, offering, keys)  
4. Deploy API with webhook secret  
5. EAS dev build + sandbox test  
6. Store listings + privacy policy  
7. Production build + submit  

Estimated time: **2–4 days** first time (mostly waiting on Apple/Google review and agreements).
