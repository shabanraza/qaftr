# Competitor UX & Geo Spec — KSA + UAE (2026-11-09)

Audience: SME sellers, B2B and B2C, in KSA and the UAE. Method: pages read via WebFetch (US egress) and the in-app browser (India egress) on 2026-11-09. Qoyod, Foodics and Crowe block WebFetch, so I read them in the browser. Odoo marketing pages returned 404 at the guessed paths, so the Odoo notes are lighter.

---

## 1. Geo / region routing

### 1.1 What competitors do

| Product | URL structure | First-visit behaviour | Picker placement / design | Remembered? |
|---|---|---|---|---|
| **Wafeq** | Subfolder per locale **and** country: `/en`, `/ar` (Global), `/en-sa`, `/ar-sa`, `/en-ae`, `/ar-ae` (+ bh, eg, kw, om, qa). Full hreflang cluster with `x-default` → `/`. | `/` redirected to `/en` (canonical `/en`, "Global (USD)"). It did **not** redirect to a country by IP. The redirect is by language. | One combined control: flag + "United Arab Emirates (AED)" / "السعودية (ر.س)" / "Global (USD)", next to a language link ("عربي" / "English"). Shown in the **header and repeated in the footer**. | `django_language` cookie for language. https://www.wafeq.com/en-ae |
| **Zoho Books** | Subfolder per country (`/sa/books/`, `/ae/books/`) plus Arabic variants (`/ar-sa/books/`, `/ar-ae/books/`). hreflang: en-sa, ar-sa, en-ae, ar-ae, x-default=`/books/`. | **IP redirect from the generic `/books/` only.** From India it went to `/in/books/`. Explicit country URLs such as `/sa/books/` do **not** redirect. | "Editions and Languages" block in the **footer** (current shown as "SA-EN"; country list, each with English/العربية). **Cross-region promo bar** at the top of the SA page: "Running a business in the UAE? Zoho Books is eInvoicing-ready". | Yes (edition cookie). https://www.zoho.com/sa/books/ |
| **Qoyod** | KSA at the root, Jordan under `/jo/`. hreflang ar-sa=`/`, en-sa=`/en/`, x-default=`/`. | No redirect. Sets `qy_country=SA` cookie. | Country dropdown in the **header** (السعودية, الأردن, "الإمارات قريبًا", "مصر قريبًا"), repeated in the footer, plus a separate العربية/English toggle. This is the closest analogue to Qaftr's layout. | Cookie `qy_country`. https://www.qoyod.com/ |
| **ClearTax** | Country subfolders `/ae/`, `/sa/`, `/om/`, `/sg/`. Arabic at `/ae/ar/`. | No redirect observed. | Flag + country label **in the header** beside the nav. Other countries also linked in the footer. | n/a. https://www.cleartax.com/ae/ |
| **Daftra** | Single domain, country content by page (e.g. "الفاتورة الإلكترونية السعودية" / "…الاماراتية" under the Sales menu). | No redirect. | No country picker, only an AR/EN toggle (header + footer). | https://www.daftra.com/ |
| **Foodics** | Single site, country suffix in slugs (`/rms-uae/`, `/pay-uae/`). | No redirect. | Header has a country **phone-number dropdown** (KSA, UAE, EG, KW, JO) plus "عربي". | https://www.foodics.com/ |
| **Rewaa** | KSA only, no prefixes, Arabic only. | n/a. | None. | https://rewaa.com/ |
| **Tally MENA** | `/mena/` and `/mena/ar/`. KSA and UAE are split by topic path (`/mena/saudi-vat/`, `/mena/uae-vat/`). | No redirect seen. | Region selector (Middle East EN/AR, India, Africa…). | https://tallysolutions.com/mena/ |
| **Odoo** | Language-only prefixes (`/ar_001/`, `/en_GB/`). Country features live in docs (fiscal localizations). | Language negotiation. | Language selector in the footer. | https://www.odoo.com/documentation/19.0/applications/finance/fiscal_localizations/saudi_arabia.html |

**Pattern:** the strongest sites (Wafeq, Zoho, ClearTax, Qoyod) use **crawlable country subfolders + full hreflang + a visible manual picker**. None of them force an IP redirect away from an explicit country URL. Zoho only geo-redirects its generic `x-default` page.

### 1.2 Google's guidance (Search Central)

- *Managing multi-regional sites*: subdirectories on a gTLD are fine and low-maintenance. Avoid URL parameters for locale. **Avoid automatic redirection**, because it "could prevent users (and search engines) from viewing all the versions of your site". IP location analysis is "difficult and generally not reliable". Put visible links to the other versions on every page. https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites
- *Locale-adaptive pages*: Googlebot mostly crawls from **US IPs** and sends no `Accept-Language` header, so content adapted by locale may not be indexed for every locale. Google recommends **separate locale URLs with `rel="alternate" hreflang`**. Treat Googlebot like any user from its country. https://developers.google.com/search/docs/specialty/international/locale-adaptive-pages

### 1.3 RECOMMENDED pattern for Qaftr (Cloudflare Workers)

1. **Never redirect a deep or explicit URL.** `/tools/*`, `/guides/*`, `/ae/*` and any URL with `?lang=` are always served as-is, to every IP and to bots.
2. **Suggest, don't force.** When `request.cf.country` (or `CF-IPCountry`) is `AE` and the request is for a Saudi page that has a UAE equivalent, render a dismissible **region banner** at the top: "يبدو أنك في الإمارات — عرض صفحة الإمارات ← / Stay on Saudi". Do the mirror for `SA` visitors on `/ae/*`. Pick the banner server-side but keep the main HTML identical, and add `Vary: CF-IPCountry` (or render the banner from a tiny client fetch / inline `cf.country` value) so the cached content stays correct. Never show the banner to verified bots.
3. **Optional soft redirect for `/` only** (Zoho-style), and only if all of these hold: no `qaftr_region` cookie, no `?lang`/`?region`, not a bot, country=AE. Use a 302 to `/ae` (never 301) and set the cookie. Default: skip this and use the banner. Today `x-default` points at Saudi `/`, so a redirect at `/` would hide Saudi content from UAE-IP crawlers.
4. **Persist the choice.** Set cookie `qaftr_region=sa|ae` (1 year, `SameSite=Lax`) when the user clicks the picker or a banner button. After that, suppress the banner. The cookie only drives the banner and the logo/home link target. It never rewrites content.
5. **Visible picker on every page, in the header and footer**, combining country and currency like Wafeq: `🇸🇦 السعودية (ر.س)` / `🇦🇪 الإمارات (د.إ)`, next to the `English | العربية` toggle. Switching maps to the **equivalent page** (`/tools/vat-calculator` ↔ `/ae/tools/vat-calculator`, `/tools/trn-checker` ↔ `/ae/tools/trn-checker`, `/tools/fatora` ↔ `/ae/tools/invoice-generator`, `/tools/zatca-wave-checker` ↔ `/ae/tools/e-invoicing-readiness`, `/guides/zatca-wave-25` ↔ `/ae/guides/uae-e-invoicing-2027`) and keeps `?lang`.
6. **hreflang: one cluster per equivalent pair.** Today Saudi pages emit `ar-SA / en / x-default` and UAE pages emit their own separate `ar-AE / en-AE / x-default`. Join them, for example on both `/tools/vat-calculator` and `/ae/tools/vat-calculator`: `ar-SA`=`/tools/vat-calculator`, `en-SA`=`…?lang=en`, `ar-AE`=`/ae/tools/vat-calculator`, `en-AE`=`/ae/…?lang=en`, `x-default`=Saudi Arabic. Keep a generic `en`/`ar` fallback on Saudi only if you want Saudi to be the catch-all. Pages with no counterpart (e.g. a ZATCA-only guide) keep their own two-language cluster. Each URL self-canonicalises.
7. Long term, consider `/en/...` style paths over `?lang=en`. Google tolerates parameters for hreflang, but it lists them as the weakest signal.

---

## 2. Wording / terminology

### 2.1 Glossary

| Concept | KSA English | KSA Arabic | UAE English | UAE Arabic | Source / note |
|---|---|---|---|---|---|
| Full invoice | Tax Invoice | فاتورة ضريبية | Tax Invoice | فاتورة ضريبية | ZATCA e-invoicing intro (https://zatca.gov.sa/ar/E-Invoicing/Introduction/Pages/What-is-e-invoicing.aspx). UAE VAT Exec. Reg. Art. 59 |
| B2C invoice | Simplified Tax Invoice | فاتورة ضريبية مبسطة | Simplified Tax Invoice (**being phased out**, see §4) | فاتورة ضريبية مبسطة | ZATCA (link above). A&M alert (§4) |
| Seller tax ID | VAT Registration Number ("VAT number") | الرقم الضريبي / رقم التسجيل في ضريبة القيمة المضافة | Tax Registration Number (**TRN**) | رقم التسجيل الضريبي | KSA: 15 digits starting and ending in 3. UAE: 15 digits. ClearTax links an Arabic "TRN verification" page (https://www.cleartax.com/ae/) |
| E-invoicing | E-invoicing / Fatoora | الفوترة الإلكترونية (process), الفاتورة الإلكترونية (document) | eInvoicing / e-invoicing | الفوترة الإلكترونية | ZATCA. Wafeq `/ar-ae` |
| Phase 1 | Generation Phase (Phase 1) | مرحلة الإصدار والحفظ | — | — | ZATCA |
| Phase 2 | Integration Phase (Phase 2) | مرحلة الربط والتكامل ("المرحلة الثانية" in marketing) | — | — | ZATCA. Wafeq/Qoyod use "المرحلة الثانية" |
| Waves | Wave 24 / 25 … | الموجة الخامسة والعشرون | Phases (2027 by revenue band) | المرحلة | — |
| Authority portal | FATOORA portal / ZATCA | بوابة فاتورة / هيئة الزكاة والضريبة والجمارك | FTA / EmaraTax; MoF | الهيئة الاتحادية للضرائب / إمارات تاكس؛ وزارة المالية | Qoyod hero mock: "رمز التحقق من بوابة فاتورة", "شهادة التشفير (CSID)" |
| Provider | E-invoicing solution provider (ZATCA directory, explicitly **not** an approval) | مزود حلول الفوترة الإلكترونية | **Accredited Service Provider (ASP)** | مزود خدمة معتمد | ZATCA directory (https://www.zatca.gov.sa/en/E-Invoicing/SolutionProviders/Pages/SolutionProvidersDirectory.aspx). Wafeq "Accreditation #129932" |
| Network | — (ZATCA clearance/reporting) | التخليص / الإبلاغ | Peppol, PINT AE | شبكة Peppol | Wafeq, Zoho AE, ClearTax |
| Credit note | Credit Note | إشعار دائن | (Tax / electronic) Credit Note | إشعار دائن (ضريبي) | ZATCA: "الإشعارات المدينة والدائنة" |
| Debit note | Debit Note | إشعار مدين | Debit Note (rare in UAE) | إشعار مدين | ZATCA |
| Supply date | Supply date | تاريخ التوريد | Date of supply | تاريخ التوريد | Required field in both regimes |
| Issue date | Issue date | تاريخ الإصدار | Invoice date | تاريخ الفاتورة | — |
| Incl./excl. | VAT-inclusive / VAT-exclusive | شامل ضريبة القيمة المضافة / غير شامل الضريبة | same | same | Zoho: "Prices are exclusive of local taxes" |
| Subtotal | Subtotal (excl. VAT) / Total taxable amount | المجموع الفرعي / الإجمالي الخاضع للضريبة | Subtotal / Taxable amount | المجموع الفرعي / المبلغ الخاضع للضريبة | — |
| VAT amount | VAT amount (15%) | مبلغ ضريبة القيمة المضافة | VAT (5%) | ضريبة القيمة المضافة | — |
| Total | Total amount due / Total (incl. VAT) | الإجمالي المستحق / الإجمالي شامل الضريبة | Total payable / Gross amount | المبلغ المستحق | Use "المبلغ المستحق" rather than "إجمالي الدفع" |
| Discount | Discount | خصم | Discount | خصم | — |
| Parties | **Seller / Buyer** (ZATCA XML & data dictionary) | **البائع / المشتري** | **Supplier / Recipient (customer)** in law; "customer" in UIs | **المورد / المستلم (العميل)** | Use the regime's words on invoice PDFs. "Customer/العميل" is fine in app UI |
| Currency | SAR, ر.س (new ﷼ symbol) | ريال سعودي | AED, د.إ (new Dirham symbol) | درهم إماراتي | Wafeq labels "(ر.س)" / "(د.إ)" |

### 2.2 Positioning patterns (SME, B2B+B2C)

| Element | What leaders say | Takeaway for Qaftr |
|---|---|---|
| Headline | Wafeq AE: "Ready for UAE e‑invoicing." / Wafeq SA: "…جاهز للمرحلة الثانية من الفوترة الإلكترونية". Qoyod: "قيود الحل الآمن والموثوق للفوترة الإلكترونية". ClearTax: "Best Peppol-ready e-invoicing solution in UAE" | **Compliance-first, region-specific headline**: name the regime (المرحلة الثانية / UAE 2027) in the H1 |
| Sub-value | Outcome + scope: "every invoice is sent through Peppol and reported to the FTA for you" (Wafeq) | State the mechanism in one line |
| Primary CTA | "Start now for free" / "ابدأ الآن مجاناً" (Wafeq); "أصدر أول فاتورة الآن مجانًا" (Qoyod); "ابدأ الاستخدام مجانًا" (Daftra); "جرّبه الحين" (Rewaa) | Action-led Arabic CTA: **"أصدر فاتورتك الأولى مجاناً"** |
| Secondary CTA | "Request a demo" (Zoho), "تحدث مع المبيعات" (Qoyod), "Book a demo" (ClearTax, Tally, enterprise-leaning), "How UAE e-invoicing works" (Wafeq, educational) | Use the educational secondary (guide link) plus WhatsApp. "Book a demo" fits later |
| Micro-copy under CTA | "14 days free trial - no credit card needed" / "14 يوماً تجربة مجانية - بدون بطاقة ائتمان" | Add "بدون بطاقة ائتمان" |
| Trust | Counts: Wafeq 18,000+, Qoyod "أكثر من 25 ألف منشأة سعودية", Daftra 45,000+, Rewaa 23,000+, Tally 2.7M+. Google rating 4.8 (Wafeq, Qoyod). Badges: "معتمد من هيئة الزكاة", "ZATCA approved Phase 2 e-invoicing" (Zoho), "Accredited Service Provider · Accreditation #129932", "Peppol certified", SOC 2, "خوادم داخل المملكة" | Use only accurate claims. ZATCA's directory is not an approval, so say "متوافق مع متطلبات المرحلة الثانية" unless listed. Never claim "FTA accredited" without accreditation. Use honest counters (invoices generated with the free tools) |
| Pricing | Zoho: Monthly/Yearly toggle "Save up to 25%", Free plan SAR0/AED0, "Price/Org/Month", "Most Popular" tag, "*Prices are exclusive of local taxes". Wafeq/Qoyod: separate pricing page, 14-day trial. Qoyod notes Phase 2 is "في الباقة الاحترافية فأعلى" | Local currency per region, VAT-exclusive note, a free tier, and one "most popular" plan |

---

## 3. UI/UX patterns

| Area | Observed best practice |
|---|---|
| **Nav** | Wafeq: Products · Industries · Pricing · Accountant Perks · Resources. Qoyod mega menu: products with one-line descriptions and "جديد" tags, Integrations (Salla, Zid, Shopify logos), 15+ sectors, Pricing, Resources. Zoho: Features (Core / **Compliance** / Accounting) · Pricing · Solutions · Customers · Resources. ClearTax keeps it simple: About · Resources · Partners · Contact + "Book a demo" |
| **Header right cluster** | Region picker → language → "تسجيل الدخول" → filled primary CTA. Qoyod's header is static, not sticky. Wafeq/Zoho keep the CTA visible |
| **Hero** | Text + CTA on the start side, **product mock on the end side**. Qoyod's mock shows a "تم الربط بنجاح" Fatoora connection card with CSID, environment and recent invoices sent to ZATCA. Badge row under the CTA: "دعم فني 24/7 · معتمد من هيئة الزكاة · تقييم 4.8 على Google" |
| **Deadline banner** | Wafeq AE: "Switch to Wafeq as your ASP" deadline strip. Zoho: cross-region promo bar |
| **Resources as SEO hub** | Wafeq Resources lists "E-invoicing in UAE", "Accredited Service Provider in the UAE", "Zatca QR Scanner". ClearTax lists "FTA Approved ASP List", mandatory fields, TRN verification, VAT calculator. Tally: `/mena/uae-vat/online-vat-calculator/` |
| **Footer** | 2–4 link columns, per-country phone numbers (Wafeq, Daftra, Foodics), legal entity and address per region (Wafeq: Riyadh vs Dubai Media City), badges (SOC 2, Peppol, ZATCA), region and language picker repeated |
| **Mobile** | Hamburger with accordion sections, CTA pinned at the bottom of the drawer, region/lang inside the drawer |
| **Tool pages** (ClearTax/Tally calculators, Wafeq QR scanner) | Single-purpose: H1 = the job, input card, instant result, explainer and FAQ below, contextual product CTA after the result |

### 3.1 Top 15 improvements for Qaftr (prioritised)

1. **Header region picker** with flag + currency (`السعودية (ر.س)` / `الإمارات (د.إ)`), mapping to the equivalent page and keeping `?lang`. Repeat it in the footer and the mobile drawer.
2. **Geo suggestion banner** (CF-IPCountry, dismissible, cookie `qaftr_region`). No forced redirects (§1.3).
3. **Unified hreflang clusters** across SA↔AE equivalent pages, using `en-SA` and `en-AE`.
4. **Region-specific H1s** naming the regime: KSA "فاتورة ضريبية متوافقة مع المرحلة الثانية — مجاناً". UAE "جاهز للفوترة الإلكترونية في الإمارات 2027".
5. **Tool layout: form start-side, live invoice/result preview end-side** (stacked on mobile, with a sticky "Download PDF" bar at the bottom). Result cards show subtotal, VAT, total, plus copy and share actions.
6. **Post-result CTA**, placed right after a successful calculation, TRN check or PDF: "احفظ عملاءك وأصدر فواتير متتالية — أنشئ حساباً مجاناً". This converts better than a CTA placed before the result.
7. **CTA wording**: primary "أصدر فاتورتك الأولى مجاناً" / "Create your first invoice free". Micro-copy "بدون بطاقة ائتمان". Secondary is the guide link or WhatsApp.
8. **Trust row under the hero**: accurate compliance badges ("متوافق مع متطلبات هيئة الزكاة", "جاهز لـ Peppol / PINT AE" once true), "بياناتك محفوظة", plus a real usage counter. Drop any claim you can't source.
9. **Terminology pass on invoice PDFs and forms** per the glossary: البائع/المشتري and "الرقم الضريبي" (KSA) vs المورد/العميل and "رقم التسجيل الضريبي (TRN)" (UAE). Show "تاريخ التوريد" and a "شامل/غير شامل الضريبة" toggle.
10. **Remove or relabel the UAE "simplified tax invoice" option** (§4). Default UAE output to a full Tax Invoice.
11. **Resources mega-panel** (simple two-column dropdown, not a full mega menu): Tools column (VAT calculator, TRN checker, invoice generator, readiness checker) and Guides column (Wave 25, UAE 2027, ASP explained), each with a one-line description.
12. **Deadline strip** per region (e.g. "الموجة 25 — موعد الربط …" / "UAE e-invoicing: Jan 2027 for AED 50m+ revenue"), linking to the guide. Dismissible.
13. **FAQ accordions with FAQPage schema** on every tool. Each answer is 2–3 sentences in the authorities' wording, with an outbound link to ZATCA or the FTA.
14. **Footer per region**: entity/contact, WhatsApp, authority links (zatca.gov.sa / tax.gov.ae), region and language pickers, a "Tools" column.
15. **"For businesses" by-industry links** (retail, restaurants, services, contracting), even as anchors to one page at first. This copies Qoyod and Wafeq's "Industries" entry cheaply and signals B2B+B2C, not freelancers.

**Cheap to copy:** Wafeq's combined region+currency control, Zoho's cross-region promo bar, Qoyod's product-mock "connected to Fatoora" card, and Zoho's "prices exclusive of VAT" footnote.

---

## 4. UAE simplified tax invoice: current rule

Cabinet Decision No. 100 of 2025 (issued 12 Aug 2025, effective 29 Sep 2025) amended Articles 59–60 of the VAT Executive Regulation for e-invoicing. Alvarez & Marsal's alert says the simplified tax invoice formats in **Art. 59(2) and (5)** "will no longer be allowed for businesses covered under the UAE e-Invoicing scope". The same applies to the FTA's administrative exceptions (59(7)) and the wholly-zero-rated relief (59(3)), and these reliefs end once a business is live on e-invoicing. Grant Thornton puts it as "The concept of simplified invoices has been removed under the e-invoicing framework", and says businesses that issued simplified invoices "for supplies below AED 10,000 will be required to issue e-invoices". The removal is therefore tied to e-invoicing scope and go-live, not an immediate ban for everyone. Initial scope is B2B/B2G, so B2C treatment should be re-checked against the Ministerial Decisions. On the threshold: the pre-amendment Art. 59(2) text refers to the "consideration for the supply" not exceeding AED 10,000 (registrant recipient). Practitioner guides (e.g. Tally, ClearTax) treat it as **VAT-inclusive**, but I found no FTA text stating this explicitly. For in-scope businesses the point is moot once they go live. I could not retrieve the official MoF PDF (404), so verify it before relying on clause numbers.
Sources: https://www.legal500.com/intelligence/united-arab-emirates/tax/middle-east-tax-alert-uae-latest-vat-law-amendments-for-the-upcoming-uae-e-invoicing-implementation (A&M) · https://www.grantthornton.ae/insights/articles2/tax-alert-executive-regulation-amendments/ · https://mof.gov.ae/en/news/ministry-of-finance-announces-amendments-to-executive-regulations-of-federal-decree-law-on-value-added-tax/ · https://tallysolutions.com/mena/uae-vat/simplified-tax-invoice-under-vat-in-uae/ · https://www.cleartax.com/ae/create-simplified-vat-invoice-uae
