# Qaftr — Audit, Market Research & Opportunity Plan

Date: 2026-11-08 · Scope: codebase audit (web + mobile + shared), live-site SEO check of qaftr.com, KSA/UAE market research, niche and micro-SaaS opportunities.

> Search volumes below are **directional** (from autocomplete, SERP shape, and earlier research in `SEO_TRAFFIC_PLAN.md`). Confirm them in Google Keyword Planner, Ahrefs, or GSC before committing large content budgets. Regulatory dates come from third-party sources. Check them against ZATCA, MoF, and FTA before publishing.

---

## 0. TL;DR — the one thing that changes everything

**ZATCA Wave 25** covers every taxpayer with VAT-subject revenue **above SAR 187,500** in any year from 2022 to 2025. The integration deadline is **1 February 2027**. SAR 187,500 is the *voluntary VAT registration threshold*, so this wave pulls in essentially **every VAT-registered small business and freelancer in Saudi Arabia**, which is Qaftr's exact target audience.

Today Qaftr only produces **Phase 1** invoices: a PDF plus a TLV QR code. From Feb 2027 those invoices will no longer be compliant for most VAT-registered users. Meanwhile the site says "Yes, Qaftr is ZATCA compliant" (`routes/tools/fatora.tsx`), which becomes a **liability**.

At the same time, this is the **biggest traffic and revenue window Qaftr will ever have**. Over the next 12 weeks, hundreds of thousands of micro-businesses will search "الموجة 25", "ربط الفوترة الإلكترونية", and "cheap ZATCA phase 2". Incumbents (Wafeq, Qoyod, Zoho) start at about **SAR 99/month**, and that is too expensive and too complex for a freelancer.

**Recommendation:** reposition Qaftr as *"the cheapest, simplest ZATCA Phase 2 path for Saudi freelancers and micro-businesses, Arabic-first, WhatsApp-native"*. Do this through a Phase 2 API partner now, and decide later whether to build in-house. Then expand to the UAE ahead of its **July 2027 SME e-invoicing go-live**.

---

## 1. Project exploration — what exists

| Layer | Stack |
|---|---|
| Web | TanStack Start (React 19, SSR) on **Cloudflare Workers**, Tailwind v4, shadcn/radix UI |
| API | tRPC v11 (`business`, `clients`, `invoices`, `quotes`, `instant-invoice`, `billing`) |
| DB | Neon Postgres + Drizzle ORM (2 migrations) |
| Auth | Better Auth (email/password) |
| Billing | RevenueCat (webhook → entitlements), Pro at SAR 39/month or SAR 349/year |
| Mobile | Expo / React Native + NativeWind, RevenueCat paywall |
| Shared | `@zatca/shared`: TLV QR, VAT calculator, invoice totals, Saudi VAT-number analyser (17 tests) |

**Public surface:** home with the embedded instant invoice tool, `/tools` (fatora, vat-calculator, trn-checker), 6 SEO landing pages, support, privacy.
**Private surface:** `/workspace` (Money Desk dashboard, invoices, quotes, clients, WhatsApp follow-ups, accountant export) and `/invoices`.

The product thesis in `QAFTR_CORE_BUILD_PLAN.md` ("money desk for Saudi freelancers who run their business through WhatsApp") is sound. Its explicit assumption that there is **"no ZATCA Phase 2"** is the part that no longer holds.

---

## 2. SEO / GA4 / Search Console audit

Verified on the live site (`qaftr.com`) and in code.

### Critical

| # | Issue | Evidence | Fix |
|---|---|---|---|
| S1 | **`<html lang="en">` and no `dir` on Arabic pages** | Live: `document.documentElement.lang === "en"`, `dir === ""`. The cause is that `__root.tsx` uses Paraglide `getLocale()`, and Paraglide is configured for **en/de** (template leftover), not ar. | Derive lang/dir from the `?lang` search param (or a path prefix) in the root shell: `<html lang="ar-SA" dir="rtl">`. Delete the Paraglide de/en scaffolding or reconfigure it to `ar`/`en`. |
| S2 | **The English version canonicalises to the Arabic URL** | `seo.ts`: `canonical = url` for both languages, while hreflang `en` points to `?lang=en`. Google sees "en page says I'm a duplicate of ar" and drops English from the index. | Make each language self-canonical: `?lang=en` pages get `canonical = …?lang=en`. Better: move English to `/en/...` paths (clean URLs, easier hreflang, and room for `/ae/`). |
| S3 | **Private pages are `index, follow`** | `/workspace/*` and `/invoices/*` reuse `buildMarketingHead`, which hard-codes `robots: index, follow`, and SSR returns a marketing shell. | Add a `noindex: true` option and use it on all authed routes. Add `Disallow: /workspace`, `/invoices`, `/api` to `robots.txt`. |
| S4 | **Phase 1 "ZATCA compliant" claims** | FAQ on `/tools/fatora` and in the landing-page copy. | Reword now: "Phase 1 (Generation) QR. If ZATCA has notified you for Phase 2 integration, you need an integrated solution." Then link to the Phase 2 offer (see §5). |

### High

| # | Issue | Fix |
|---|---|---|
| S5 | Keyword cannibalisation: `/`, `/tools/fatora`, `/free-invoice-generator`, `/invoice-generator-saudi-arabia`, `/zatca-invoice-generator`, and `/vat-invoice-generator-saudi-arabia` all target "invoice generator" and all CTA to the same tool. | Give each one a distinct intent (see §3). Make `/tools/fatora` the single "money page". Turn the others into real guides, or 301 or merge them. |
| S6 | The landing pages are thin: about 25 body sections across 12 page/language variants, roughly 2 short cards per page plus a FAQ. | Aim for 900–1,500 words each, with an example invoice image, a checklist table, a ZATCA source citation, and an updated date. |
| S7 | The sitemap has no `lastmod`, no English URLs, and no `xhtml:link` hreflang. It is static and will drift. | Generate the sitemap from the route list at build time, with alternates for each language. |
| S8 | GA4 sends only page views. There are **no conversion events**, so no funnel. | Send `gtag('event', …)` for `invoice_pdf_download`, `invoice_save_click`, `sign_up`, `paywall_view`, `purchase`, `tool_used` (vat/trn/qr), and `whatsapp_share`. Mark the first 3 as key events. Add **Consent Mode v2** defaults. Link GA4 ↔ Search Console. |
| S9 | Render-blocking `@import` of **4 Google font families** (Fraunces, Manrope, IBM Plex Sans Arabic, Noto Kufi Arabic) in `styles.css`. | Self-host 2 families as WOFF2 subsets (Arabic + Latin), with `preload` and `font-display: swap`. Drop Fraunces and Manrope, or load them only on English pages. |
| S10 | The `keywords` meta tag is identical on every page. | Remove it, since Google ignores it. Spend the effort on title/H1 uniqueness instead. |

### Medium

- GA4 and GSC IDs are hard-coded as fallbacks in `constants.ts`. That is fine for production, but **preview and dev deploys pollute GA4**. Only emit them when `SITE_URL === 'https://qaftr.com'`.
- The GSC verification is set up for a **URL-prefix property**. Add a **Domain property** (DNS TXT in Cloudflare) so `www`, http, and future subdomains like `ae.qaftr.com` are covered.
- No Bing token is set. Bing powers Copilot and DuckDuckGo, and it is quick to add.
- Structured data: add `SoftwareApplication` with `offers` for Pro (SAR 39), `HowTo` on the guides, and `Article` with `dateModified` on the guides. Organization `sameAs` points only to itself; add the App Store, Play, X, and LinkedIn URLs once they exist.
- The `/tools/trn-checker` naming is ambiguous. **"TRN" is the UAE term**; Saudis say "الرقم الضريبي / VAT number". Keep the Saudi page but rename its H1 and title. Use "TRN" for a new UAE checker (see §6).

---

## 3. Keyword research — KSA (Arabic-first)

Intent clusters with the page that should own each. Difficulty is a rough judgement from who currently ranks: L = thin utilities ranking, M = SaaS vendors ranking, H = ZATCA or big brands ranking.

| Cluster | Seed keywords (AR / EN) | Intent | KD | Owner page |
|---|---|---|---|---|
| **Wave 25 / Phase 2 (NEW, urgent)** | الموجة 25 الفوترة الإلكترونية · المرحلة الثانية زاتكا · ربط الفوترة الإلكترونية · هل أنا ملزم بالربط مع زاتكا · zatca wave 25 · zatca phase 2 small business · cheapest zatca phase 2 | Info → commercial | M | `/guides/zatca-wave-25` + `/tools/wave-checker` + `/phase-2` (offer) |
| Free tax invoice | فاتورة ضريبية · فاتورة ضريبية مبسطة · فاتورة ضريبية pdf · فاتورة ضريبية جاهزة · free invoice generator saudi | Transactional | M | `/tools/fatora` |
| QR | قارئ QR فاتورة زاتكا · zatca qr code scanner / validator / generator | Utility | L | `/tools/zatca-qr` (decode + validate + generate) |
| **XML validation (dev/accountant)** | zatca xml validator · ubl invoice validator zatca · التحقق من فاتورة xml | Utility | L | `/tools/zatca-xml-validator` |
| Requirements | متطلبات الفاتورة الضريبية · vat invoice requirements saudi arabia · simplified vs standard tax invoice | Info | M | `/guides/saudi-tax-invoice-requirements` |
| **Arabic document templates** | سند قبض · نموذج سند قبض pdf · عرض سعر · نموذج عرض سعر · فاتورة غير ضريبية · إشعار دائن · مذكرة مدينة | Transactional | **L** | `/tools/sanad-qabd`, `/tools/quote`, `/tools/credit-note` |
| VAT math | حاسبة الضريبة 15 · حساب الضريبة من المبلغ الشامل · استرداد الضريبة | Utility | M | `/tools/vat-calculator` (add reverse calculation) |
| VAT number | التحقق من الرقم الضريبي · saudi vat number check | Utility | M | `/tools/vat-number-checker` (rename) |
| Freelancer | فاتورة للعمل الحر · وثيقة العمل الحر فاتورة · هل المستقل يحتاج سجل ضريبي | Info | L | `/guides/freelancer-invoicing-saudi` |

**Quick wins** (low KD, Arabic, transactional): **سند قبض**, **عرض سعر**, **فاتورة غير ضريبية**, and **إشعار دائن**. They reuse 90% of the existing invoice engine, and current rankings are dominated by Word or Excel template sites. A no-signup PDF generator with WhatsApp share would outrank them.

---

## 4. Competitive landscape & gaps

| Segment | Players | Weakness Qaftr can exploit |
|---|---|---|
| Full accounting SaaS (KSA) | Qoyod, Wafeq, Daftra, Zoho Books SA, Rewaa, Tally | SAR 99–999/month, accountant-oriented UI, overkill for a freelancer with 5 invoices a month |
| Global generators | Refrens, Zoho Invoice, Canva, Invoice-generator.com | Not Arabic-first, weak ZATCA QR, no Phase 2 |
| Thin utility sites | SmoothLedger, KipBill, Invovate, Docly, Velmont | No product behind them, no persistence, no WhatsApp |
| Enterprise compliance | EDICOM, Avalara, Thomson Reuters, ClearTax | Integration and API focus, sales-led |
| Official | ZATCA Fatoora portal | Compliance info only, no creation UX |

**Gaps:**
1. **A sub-SAR-50 Phase 2 product for micro-businesses.** Nobody owns "the WhatsApp-native, 2-minute Phase 2 onboarding" for freelancers.
2. **Arabic-first free utilities with real depth**: QR decode, XML validation, and wave checking. Current results are vendor blog posts, not tools.
3. **A cross-GCC freelancer** who bills in SAR and AED. No simple tool does both 15% and 5% with both e-invoicing regimes.
4. **The accountant channel.** Small accounting offices in Riyadh, Jeddah, and Dubai manage dozens of micro clients. A multi-client "accountant seat" with bulk export is missing at this price point.

---

## 5. Recommended plan — KSA (now → Feb 2027)

### Phase A: Fix and protect (week 1)
1. Fix S1–S4 (lang/dir, canonicals, noindex, compliance wording).
2. Add GA4 events and key events, Consent Mode, the Domain property in GSC, and Bing.
3. Mobile nav: the header `nav` is `hidden md:flex` with **no mobile menu**, so phone users (the majority in KSA) can't reach Tools, Pricing, or Support. Add a sheet menu.
4. Remove the **"Coming soon to stores"** badge from the header and the home CTA card. On a live product it reads as "not ready". Replace it with store badges, or with "Create free invoice".

### Phase B: Ride Wave 25 (weeks 1–6)
1. **`/tools/wave-checker`** ("هل أنت ضمن الموجة 25؟"): a 3-question quiz (VAT registered? revenue band per year? notified by email/SMS?) that returns the wave, the deadline, and next steps, with email/WhatsApp capture for a "deadline reminder". This is a lead magnet.
2. **`/guides/zatca-wave-25`** (AR + EN): a pillar page with an FAQ and a dated changelog. Update it within 48 hours of any ZATCA announcement.
3. **`/tools/zatca-qr`**: decode a pasted or scanned QR, validate the TLV fields, and explain Phase 1 vs Phase 2 QR (Phase 2 adds tags 6–9: hash, signature, public key, stamp).
4. **`/tools/zatca-xml-validator`**: upload a UBL 2.1 XML invoice and check the mandatory fields and business rules client-side. A link magnet for developers and accountants.

### Phase C: Phase 2 product (weeks 2–12)
- **Option 1, recommended to start:** integrate a ZATCA-compliant **e-invoicing API provider** (white-label onboarding: CSR → compliance CSID → production CSID, signing, reporting/clearance). Launch "Qaftr Phase 2" at **SAR 29–49/month**, undercutting the SAR 99 incumbents.
- **Option 2:** build in-house. You would need UBL 2.1 XML, XAdES signing, invoice hash chaining (PIH), ICV counters, reporting for simplified invoices within 24 hours, and clearance for standard B2B invoices. That is weeks of work plus compliance testing on ZATCA's simulation portal, so do it after you have revenue.
- Data model work either way: an invoice counter (ICV), the previous hash, `invoice_type` (standard/simplified), and a credit/debit note link to the original invoice.

### Phase D: Template quick-wins (weeks 3–8)
Build سند قبض, عرض سعر (quotes already exist in the workspace, so expose a free public version), فاتورة غير ضريبية, and إشعار دائن. Each gets its own route, FAQ, HowTo schema, and funnel into save/Pro.

---

## 6. UAE / Dubai expansion (Q1–Q2 2027)

**Why:** The UAE e-invoicing **pilot started 1 July 2026**. Go-live is **1 Jan 2027 for businesses above AED 50M**, **1 July 2027 for everyone else**, and **1 Oct 2027 for government**. It uses the Peppol 5-corner model with the PINT AE format through Accredited Service Providers (ASPs). **B2C is excluded for now**, so the pain is B2B invoicing by small firms and freelancers billing companies. UAE corporate tax also creates a fixed **AED 10,000 penalty** for late registration, and Small Business Relief questions keep coming up.

| Opportunity | Type | Keywords |
|---|---|---|
| UAE VAT invoice generator (AED, 5%, TRN, Arabic/English) | Free tool | uae tax invoice generator · فاتورة ضريبية الإمارات · free invoice template uae |
| UAE TRN format checker (15 digits, begins `100`) | Free tool | trn number check uae · verify trn |
| **UAE e-invoicing readiness checker** (which phase, deadline, ASP needed?) | Free tool + lead magnet | uae e-invoicing deadline · peppol uae small business |
| Corporate Tax: Small Business Relief eligibility + registration-deadline calculator | Free tool | small business relief uae calculator · corporate tax registration deadline freelancer |
| Freelance-permit invoicing guide (Dubai/Abu Dhabi free zones) | Guide | freelance visa invoice dubai |
| Product: Peppol-ready invoicing for UAE freelancers, through an ASP partner | SaaS | — |

**Site structure:** use `/ae/` (Arabic) and `/ae/en/` subfolders with hreflang `ar-AE` and `en-AE`, alongside the KSA `ar-SA`. Don't use a separate domain, because it would split the authority you've built. Add AED pricing (AED 39/month) in RevenueCat.

---

## 7. Adjacent niches & micro-SaaS ideas (ranked)

| Rank | Idea | Market | Why | Effort |
|---|---|---|---|---|
| 1 | **Qaftr Phase 2 Lite** (above) | KSA | Hard deadline, mass market, incumbents overpriced | M (via partner) |
| 2 | **Accountant Seat**: manage 20–100 micro clients, bulk Phase 2 onboarding, monthly VAT packs | KSA + UAE | B2B2C channel; one accountant brings 30 clients | M |
| 3 | **WhatsApp payment-reminder bot** (already in the plan): automated Arabic reminders plus payment links (Moyasar/Tap/HyperPay, Apple Pay, Mada) | KSA + UAE | Late payment is the #1 freelancer pain; payment-link fees add revenue | M |
| 4 | **UAE Peppol invoicing for SMEs** | UAE | July 2027 deadline, same playbook as KSA | M–H |
| 5 | Arabic document-generator suite (receipt, quote, credit note, salary certificate, rent receipt) | KSA + UAE | Low-KD Arabic traffic engine feeding the core product | L |
| 6 | End-of-service (EOSB) calculator, Saudi + UAE labour law | KSA + UAE | Huge evergreen volume. The official HRSD calculator exists, but its UX is poor. Off-core, so use it only as a traffic and brand play. | L |
| 7 | Rent invoice / commercial-lease VAT tool for Riyadh/Jeddah landlords (Ejar context) | KSA | Landlords with commercial units must issue VAT invoices; underserved | L–M |

**Avoid:** generic "AI invoice" features before the Phase 2 path exists, and city-name doorway pages ("invoice generator Riyadh"). Those are thin and risk a penalty. For Riyadh and Dubai, target with **geo-targeted ads, local accountant partnerships, and freelancer communities** instead.

---

## 8. Architecture, theme & layout bugs

| Sev | Area | Bug | Location |
|---|---|---|---|
| High | Layout | No mobile navigation: Tools, Pricing, and Support are unreachable on phones | `components/marketing/MarketingLayout.tsx` (`nav` is `hidden md:flex`) |
| High | i18n | Paraglide is configured for `en`/`de` with template messages ("Willkommen…"), and it drives `<html lang>` | `project.inlang/settings.json`, `messages/de.json`, `routes/__root.tsx` |
| High | SEO/arch | `buildMarketingHead` is reused for private routes, so they get index/canonical/hreflang | `routes/workspace*.tsx`, `routes/invoices/*` |
| Med | UX | The "Coming soon to stores" badge appears on a live product, in both the header and the final CTA, and the final CTA has no actionable button | `MarketingLayout.tsx:155`, `routes/index.tsx:183` |
| Med | RTL | `dir` is set on an inner `div`, not on `<html>`, so scrollbars, portals (dialogs, toasts render outside that div), and form autofill are LTR | `MarketingLayout.tsx`, radix `Dialog` portals |
| Med | Perf | 4 web-font families are loaded via CSS `@import` (render-blocking, about 300 KB+) | `styles.css:1` |
| Med | Build | The `invoice-app` test suite doesn't run: the Cloudflare Vite plugin is incompatible with Vitest (noted in the QA report and still open) | `vite.config.ts` (use a separate `vitest.config.ts` without the cloudflare plugin) |
| Med | Deps | Many `"latest"` versions (TanStack, devtools) cause non-reproducible builds. `@faker-js/faker` is in prod `dependencies`, and the devtools packages too. | `invoice-app/package.json` |
| Low | Infra | The Worker is still named `tanstack-start-app`. It has no routes or custom-domain config in code, and no observability or logs config. | `wrangler.jsonc` |
| Low | Repo | Temp files are committed: `mobile/.tmp_batch6_expr.txt` and `mobile/assets/review-screenshots/.tmp/*` | add them to `.gitignore` and `git rm --cached` |
| Low | Links | "Related pages" uses raw `<a href>`, causing full reloads and losing preload | `SeoLandingPage.tsx` |
| Low | Analytics | GA config is injected on every environment, including localhost and previews | `routes/__root.tsx` |

**Architecture verdict:** the stack is modern and suitable: Workers SSR, Neon, and a shared pure-TS package are a good base for a Phase 2 signing module, which would live in `packages/shared` or as a separate Worker. Two structural changes are needed before scaling content:
1. **Language routing.** Move from `?lang=en` to path prefixes (`/en`, `/ae`, `/ae/en`) with a single source of truth for locale → lang/dir/hreflang/currency/VAT rate.
2. **A content system.** The guides and tool pages are hand-written TSX plus TS objects. Move them to MDX or a typed content collection with `updatedAt`, so the sitemap and `dateModified` are generated automatically.

---

## 9. 90-day KPI targets

| Metric | Day 30 | Day 90 |
|---|---|---|
| Indexed pages (GSC) | 25 | 60 |
| GSC impressions/week | 2k | 20k |
| Organic clicks/week | 100 | 1.5k |
| Wave-checker leads | 100 | 1,500 |
| Free → saved-invoice signups | 50 | 600 |
| Phase 2 paid users | — | 150 (≈ SAR 6k MRR at SAR 39) |

---

## Sources

- Wave 25 / Phase 2: [EY Tax News – 25th wave](https://taxnews.ey.com/news/2026-1705-saudi-arabia-announces-25th-wave-of-phase-2-e-invoicing-integration), [Kaidolab – waves 2026](https://kaidolab.com/blog/zatca-phase-2-waves-2026/), [Saudi Compliance Institute – Wave 25](https://saudicomplianceinstitute.com/en/blogs/news/zatca-wave-25-e-invoicing-fatoora-integration-guide), [Flick – Wave 24](https://www.flick.network/en-sa/zatca-wave-24-phase-2-einvoicing-2026-guide)
- KSA pricing: [Qoyod – e-invoice pricing](https://www.qoyod.com/en/blog/business-knowledge/e-invoice-pricing-saudi-arabia/), [Tally – compliance cost](https://tallysolutions.com/mena/saudi-vat/zatca-compliance-cost-small-business/), [Zoho Books SA](https://www.zoho.com/sa/books/)
- KSA freelancers: [Qoyod – Saudi freelance economy 2026](https://www.qoyod.com/en/reports/saudi-freelance-economy-2026/), [Argaam – HRSD freelance documents](https://www.argaam.com/en/article/articledetail/id/1493194)
- UAE e-invoicing: [Infinite-IT – Peppol UAE guide](https://infinite-it.com/en/blog/peppol-e-invoicing-uae-guide), [The Invoicing Hub – UAE](https://www.theinvoicinghub.com/einvoicing-compliance-uae/), [KPMG – UAE mandatory fields](https://kpmg.com/us/en/taxnewsflash/news/2026/02/uae-technical-guidance-mandatory-e-invoicing-fields.html), [vatcalc – UAE](https://www.vatcalc.com/uae/uae-e-invoice-plans-2022/)
- UAE corporate tax: [Khaleej Times – FTA filing](https://www.khaleejtimes.com/business/uae-tax-authority-asks-all-businesses-to-file-corporate-tax-returns-by-september-30), [Avyanco – registration penalty](https://avyanco.com/corporate-tax-registration-deadline-uae/)
- UAE competitors: [Invovate](https://invovate.pages.dev/about), [Velmont Crest UAE tool](https://velmontcrest.ae/tools/uae-tax-invoice-generator/), [Wafeq UAE](https://www.wafeq.com/en-ae/tax-and-reporting/is-your-billing-fta-ready-how-to-choose-invoicing-software-in-the-uae), [Vyapar UAE](https://vyapar.com/en-ae)
- EOSB: [HRSD calculator](https://www.hrsd.gov.sa/en/ministry-services/services/end-service-benefit-calculator)
