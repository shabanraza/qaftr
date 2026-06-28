# Qaftr SEO Traffic Plan

Date: 2026-06-22

## Goal

Win Saudi freelancer and small-business searches where the user wants a fast, free, Arabic-first tax invoice tool, then graduate users into saved invoices and Pro.

## Evidence Used

- SERP checks for Saudi/ZATCA invoice searches show three buckets:
  - Official compliance/reference pages: ZATCA e-invoicing and validation pages.
  - Broad free invoice generators: Refrens, Zoho, Canva, SmoothLedger, KipBill.
  - Compliance vendors/articles: EDICOM, Avalara, Microsoft, Thomson Reuters, Qoyod.
- Google autocomplete variants in Saudi Arabia language/location patterns surfaced:
  - `zatca invoice`, `zatca invoice validation`, `zatca invoice scan`, `zatca invoice check`, `zatca invoice requirements`, `zatca invoice software`, `zatca invoice sample`, `zatca invoice qr code scanner`
  - `zatca qr code scanner`, `zatca qr code validation`, `zatca qr code reader online`, `zatca qr code generator online free`, `zatca qr code specifications`
  - `vat invoice requirements saudi arabia`, `vat invoice sample saudi arabia`, `vat invoice format saudi arabia`, `saudi arabia vat invoice format excel`, `how to make vat invoice in saudi arabia`
  - Arabic: `فاتورة ضريبية`, `فاتورة ضريبية مبسطة`, `فاتورة ضريبية الكترونية`, `فاتورة ضريبية pdf`, `فاتورة ضريبية جاهزة`, `فاتورة الكترونية مجانية`, `فاتورة إلكترونية pdf`, `برنامج فواتير السعودية`
- Ahrefs free resources to use repeatedly:
  - Keyword Generator for Saudi Arabia keyword ideas.
  - Keyword Difficulty Checker for single-keyword SERP difficulty.
  - Website Traffic Checker for competitor pages.
- Google Trends direction:
  - Compare `ZATCA`, `zatca invoice`, `vat invoice`, `invoice generator`, and Arabic variants in Saudi Arabia.
  - Use Trends for relative momentum, not exact volume. Treat autocomplete + SERP intent as the page-priority driver.

## Priority Keyword Clusters

### 1. Free Saudi Invoice Generator

Primary page: `/tools/fatora`

Target terms:
- `free invoice generator saudi arabia`
- `free invoice generator ksa`
- `saudi invoice generator`
- `zatca invoice generator`
- `فاتورة ضريبية جاهزة`
- `فاتورة إلكترونية pdf`

Intent:
User wants to create/download a compliant-looking invoice now, ideally without signup.

Page actions:
- H1 should include both Arabic and English intent: `فاتورة ضريبية مجانية للسعودية | Free Saudi VAT Invoice Generator`.
- Add above-the-fold copy: no signup, SAR, 15% VAT, QR, PDF, Arabic/English.
- Add FAQ schema for: ZATCA Phase 1, QR contents, VAT fields, no-signup privacy, freelancer use.

### 2. ZATCA QR Code Generator / Validator

Primary page: create `/tools/zatca-qr-code`

Target terms:
- `zatca qr code generator online free`
- `zatca qr code scanner`
- `zatca qr code validation`
- `zatca qr code reader online`
- `zatca qr code specifications`
- `QR فاتورة زاتكا`

Intent:
User is compliance-checking QR details, not necessarily making a full invoice yet.

Page actions:
- Split from the invoice generator. Make a focused QR tool page that explains TLV fields and lets users paste invoice values.
- Add internal links to `/tools/fatora` and `/tools/trn-checker`.
- Cite/align with ZATCA public QR requirements without claiming official status.

### 3. Saudi VAT Invoice Requirements / Template

Primary page: create `/guides/saudi-vat-invoice-requirements`

Target terms:
- `vat invoice requirements saudi arabia`
- `vat invoice sample saudi arabia`
- `vat invoice format saudi arabia`
- `saudi arabia tax invoice requirements`
- `how to make vat invoice in saudi arabia`
- `فاتورة ضريبية مبسطة`

Intent:
User wants to know what fields are required before making a document.

Page actions:
- Build an evergreen guide with a checklist and example invoice image.
- Link every checklist item into the generator pre-filled state where possible.
- Add FAQ schema and HowTo schema.

### 4. VAT Calculator Saudi Arabia

Primary page: `/tools/vat-calculator`

Target terms:
- `vat calculator saudi arabia`
- `saudi vat calculator`
- `حاسبة ضريبة القيمة المضافة`
- `حساب ضريبة 15%`

Intent:
Simple utility search. Lower conversion friction, good internal-link feeder.

Page actions:
- Keep this as a clean utility page.
- Add “turn this calculation into a ZATCA invoice” CTA to `/tools/fatora`.

### 5. TRN / VAT Number Checker

Primary page: `/tools/trn-checker`

Target terms:
- `saudi vat number check`
- `trn checker saudi arabia`
- `vat number validation ksa`
- `التحقق من الرقم الضريبي`

Intent:
Validation and trust before invoicing.

Page actions:
- Keep the current specific metadata for `/tools/trn-checker`; local QA confirmed the route renders a TRN-specific title and description.
- Add a short explanation that this checks format/rules, not official registration status.

## SERP Positioning

Qaftr should not fight enterprise compliance pages head-on for Phase 2 integration terms. The winnable wedge is:

- Free, no-signup, Arabic-first utilities.
- Saudi freelancer/small-business phrasing.
- Practical “make the invoice now” UX.
- Clear but careful compliance language: Phase 1, QR, VAT, PDF, not official ZATCA certification.

Competitor gaps:
- Refrens and Zoho are broad invoice products with Saudi pages, not Saudi freelancer-native.
- SmoothLedger/KipBill target free generator intent but are thin-brand utility pages.
- Official ZATCA pages answer compliance, not creation.
- Enterprise vendors answer Phase 2 integration, not immediate freelancer invoice creation.

## 30-Day Execution Plan

1. Fix page metadata and internal links:
   - `/tools/trn-checker` title/description.
   - Add stronger `/tools/fatora` links from home, VAT calculator, TRN checker, support.

2. Publish one new tool page:
   - `/tools/zatca-qr-code`
   - Include QR generator, decoder/preview if feasible, FAQ schema.

3. Publish one guide:
   - `/guides/saudi-vat-invoice-requirements`
   - Include Arabic and English sections, example invoice, checklist, CTA to generator.

4. Use Ahrefs free weekly:
   - Run `zatca invoice`, `zatca qr code`, `vat invoice saudi arabia`, Arabic seeds.
   - Record KD and top SERP pages for the top 20.
   - Pick low-difficulty long-tail terms for FAQ sections.

5. Use Google Trends weekly:
   - Saudi Arabia, past 12 months and past 5 years.
   - Compare English and Arabic variants.
   - Watch for spikes around ZATCA rollout/wave announcements and publish/update content within 48 hours.

## Measurement

Implemented setup:
- `robots.txt` points crawlers to `https://qaftr.com/sitemap.xml`.
- `robots.txt` explicitly allows key AI/search crawlers including `OAI-SearchBot`, `ChatGPT-User`, `PerplexityBot`, and `ClaudeBot`.
- `llms.txt` gives AI agents a concise map of Qaftr positioning, core pages, SEO pages, sitemap, support, and disclaimers.
- `sitemap.xml` includes the home page, tools hub, fatora generator, VAT calculator, TRN checker, support, privacy, and the first six SEO/AEO landing pages.
- Google Search Console HTML-tag verification is wired through `VITE_GOOGLE_SITE_VERIFICATION`.
- Google Analytics 4 gtag is wired through `VITE_GOOGLE_ANALYTICS_ID`.
- Bing Webmaster verification is wired through `VITE_BING_SITE_VERIFICATION` and emits the `msvalidate.01` meta tag when set.
- Global structured data now includes `Organization`, `WebSite`, and `WebApplication` JSON-LD.
- New SEO/AEO landing pages include FAQ JSON-LD and breadcrumb JSON-LD:
  - `/invoice-generator-saudi-arabia`
  - `/zatca-invoice-generator`
  - `/vat-invoice-generator-saudi-arabia`
  - `/free-invoice-generator`
  - `/e-invoicing-saudi-arabia`
  - `/small-business-invoicing-saudi-arabia`

Google account steps:
- In Search Console, add `https://qaftr.com` as a URL-prefix property, choose HTML tag verification, and set the tag content value as `VITE_GOOGLE_SITE_VERIFICATION` in the deployment environment.
- In Google Analytics, create or open the Qaftr web data stream and set its Measurement ID, which starts with `G-`, as `VITE_GOOGLE_ANALYTICS_ID`.
- After deployment, verify that the home page contains the `google-site-verification` meta tag, then submit `https://qaftr.com/sitemap.xml` in Search Console.

Bing account steps:
- In Bing Webmaster Tools, add `https://qaftr.com`.
- Choose HTML meta tag verification and copy only the token from the `content` attribute.
- Add that token to Cloudflare as `VITE_BING_SITE_VERIFICATION`.
- Redeploy, verify in Bing, then submit `https://qaftr.com/sitemap.xml`.
- After data appears, monitor Bing's AI/Copilot performance reporting alongside normal Search Console data.

Track in Google Search Console:
- Impressions and clicks by page.
- Queries containing `zatca`, `qr`, `vat invoice`, `فاتورة ضريبية`, `فاتورة الكترونية`.
- CTR for utility pages.
- Conversion from utility pages to invoice PDF download and saved invoice signup.

Primary 30-day KPI:
- 10+ indexed utility/guide queries with impressions.
- `/tools/fatora` becomes the top organic landing page.
- At least one signup/save event from organic utility traffic.
