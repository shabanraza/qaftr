# Copy changes — 2026-11-09

Scope: every user-facing label and sentence on the marketing site, the free tools and the invoice PDFs (KSA + UAE, Arabic + English). Sources: `docs/COMPETITOR_UX_SPEC_2026-11-09.md` §2 (glossary and positioning) and `docs/MARKET_SEO_AUDIT_2026-11-08.md` §3 (keywords).

## Rules applied

1. **Audience: B2B and B2C businesses.** The home page, pricing, footer taglines, core titles, H1s, meta descriptions and product copy now address SMEs, shops and service companies. Freelancer wording stays only on traffic pages: `/free-invoice-generator`, the two guides (`/guides/zatca-wave-25`, `/ae/guides/uae-e-invoicing-2027`, each with its freelancer section) and tool FAQs (`/tools/fatora`, VAT calculator).
2. **Regime terms per market.** KSA uses ZATCA terms: فاتورة ضريبية / فاتورة ضريبية مبسطة, الرقم الضريبي / VAT number, البائع / المشتري (Seller / Buyer), مرحلة الإصدار والحفظ / مرحلة الربط والتكامل, بوابة فاتورة / FATOORA portal. The UAE uses FTA terms: Tax Invoice, رقم التسجيل الضريبي (TRN), المورّد / العميل (Supplier / Customer–Recipient), تاريخ الفاتورة, المبلغ الخاضع للضريبة, المبلغ المستحق, مزوّد خدمة معتمد (ASP), PINT AE, Peppol.
3. **Accurate trust claims only.** There is no "ZATCA-approved", no "FTA accredited" and no "Phase 2 ready". The Phase 1 tool says "وفق المرحلة الأولى" / "Phase 1 (Generation)" and states that Phase 2 is not supported yet.
4. **Arabic is Modern Standard business Arabic.** All Gulf-dialect phrasing in the UAE copy (وين، تبي، الجاية، اللي، لازم، عشان، ما راح، يصير، خلك، قبل لا…) and the 404/error pages has been rewritten. Saudi Arabic copy keeps Arabic-Indic digits and UAE Arabic copy keeps Latin digits (`digits.test.ts` unchanged and passing).
5. **SEO.** Each title is at most 60 characters and each description at most 155. Both are unique per page and per language, enforced by a test. Inline SEO for `/tools`, `/tools/fatora`, `/tools/vat-calculator` and `/tools/trn-checker` moved into `getToolsCopy(lang).seo`, and the Wave 25 guide's SEO moved into `getWaveGuide(lang).seo`.

## Tests

New: `invoice-app/src/lib/marketing/copy-positioning.test.ts` (24 tests). It was written first and failed 23 of 26 tests before the copy changes (two og:image alt tests were later dropped, see below).

- No freelancer positioning on home, pricing, CTA, footer, invoice tools, tools hub, UAE hub, or any SEO title or description outside the freelancer-channel pages. Freelancer keywords must still exist on the channel pages.
- The home H1 names "زاتكا … المرحلة الأولى" / "ZATCA Phase 1" with no mention of Phase 2. The UAE hub H1 names e-invoicing and 2027.
- CTA: "أصدر فاتورتك الأولى مجاناً" / "Create your first invoice free", plus "بدون بطاقة ائتمان" / "No credit card".
- Forbidden trust claims are scanned across all copy modules.
- Glossary: Saudi labels and the PDF have no "TRN" and show البائع/المشتري and Seller/Buyer. The official ZATCA Arabic name is used. The ZATCA phase names are used. UAE labels and the PDF use رقم التسجيل الضريبي, المورّد/العميل, Supplier/Recipient and المبلغ المستحق, with no ZATCA or Saudi terms.
- SEO: length limits, uniqueness, and Arabic and English titles that differ.

Existing tests updated because the wording changed:

| Test | Change |
|---|---|
| `src/lib/instant-invoice/copy.test.ts` | Expected the wrong ZATCA name "الهيئة العامة للزكاة والضريبة والجمارك". It now expects "هيئة الزكاة والضريبة والجمارك" and forbids "الهيئة العامة للزكاة". |
| `src/lib/marketing/i18n.test.ts` | Badge text updated to "زاتكا · مرحلة الإصدار (المرحلة الأولى)" / "ZATCA Phase 1 (Generation)". |
| `src/lib/ae/invoice-html.test.ts` | Bilingual total changed from "الإجمالي المستحق" to "المبلغ المستحق". |
| `src/components/ae/UaeInvoiceGenerator.test.tsx` | Field label changed from "Issue date" to "Invoice date", and the warning text from "after the issue date" to "after the invoice date". |
| `src/components/ae/AeHubContent.test.tsx` | New UAE hub H1. |
| `e2e/invoice.spec.ts` | Saudi form labels: الاسم التجاري / اسم المشتري / تنزيل PDF; Trade name / VAT number / Buyer name. |
| `e2e/tools.spec.ts` | Saudi checker uses "VAT number" and "Valid/Invalid VAT number format". The VAT result row is now "Total incl. VAT". |
| `e2e/analytics.spec.ts` (GA4 agent's spec) | Same three Saudi form labels as above, changed only because the text changed. |

## Before → after (material changes)

### KSA home, CTA and footer — `src/lib/marketing/i18n.ts`, `src/routes/index.tsx`

| Key | Before (AR / EN) | After (AR / EN) |
|---|---|---|
| `home.kicker` | فوترة إلكترونية للمستقلين / E-invoicing for freelancers | الفوترة الإلكترونية للمنشآت في السعودية / E-invoicing for Saudi businesses |
| `home.title` + `titleAccent` (H1) | أنشئ فاتورة زاتكا · في ثوانٍ / Create ZATCA invoices · in seconds | فواتير ضريبية وفق المرحلة الأولى من زاتكا · لمنشأتك، في دقائق / ZATCA Phase 1 tax invoices · for your business, in minutes |
| `home.subtitle` | قافتر — تطبيق بسيط… بنمط المرحلة الأولى… / Qaftr — a simple Arabic-first app for Phase 1 style… | قافتر برنامج فوترة عربي للمنشآت الصغيرة والمتوسطة التي تبيع للشركات والأفراد… / Arabic-first invoicing software for Saudi SMEs that sell to businesses and consumers… |
| `home.badgeZatca` | زاتكا المرحلة الأولى / ZATCA Phase 1 | زاتكا · مرحلة الإصدار (المرحلة الأولى) / ZATCA Phase 1 (Generation) |
| `home.badgeFreelancer` → `badgeAudience` | للمستقلين / For freelancers | للشركات والأفراد / B2B and B2C |
| `home.features[*]` | QR فاتورة زاتكا، فاتورة واتساب، شعار وعلامة تجارية… | رمز QR للفاتورة الضريبية، مشاركة عبر واتساب، هوية منشأتك، ضريبة ١٥٪ تلقائياً، PDF جاهز للإرسال والأرشفة (EN equivalents) |
| `home.steps` | أضف بياناتك / أنشئ فاتورة / شارك | أضف بيانات منشأتك / أصدر الفاتورة / أرسلها إلى عميلك |
| `home.pricingTitle` / `pricingSubtitle` | أسعار بسيطة وشفافة; AR subtitle hard-coded in the route | أسعار واضحة لكل منشأة / Clear pricing for every business; subtitle now in copy (both languages) |
| `home.pro.badge` (AR) | الأكثر شعبية | الأكثر طلباً |
| `home.pro.features` | تذكيرات الفواتير / Invoice reminders | تذكير العملاء بالفواتير المستحقة / Payment reminders for customers |
| `home.ctaTitle` / `ctaBody` | جاهز لتبسيط فواتيرك؟ · قافتر قادم قريباً… | جاهز لتبسيط فوترة منشأتك؟ · أصدر فاتورتك الأولى الآن من المتصفح. تطبيق الجوال قادم قريباً… |
| `cta.createInvoice` | أنشئ فاتورتك الآن — مجاناً / Create your invoice now — free | أصدر فاتورتك الأولى مجاناً / Create your first invoice free |
| `cta.noCard`, `cta.noCardNote` (new) | — | بدون بطاقة ائتمان · نزّل PDF دون إنشاء حساب / No credit card · Download the PDF without an account (shown under both home CTAs) |
| `footer.tagline` | فواتير زاتكا للمستقلين في السعودية / ZATCA Phase 1 invoices for Saudi freelancers | برنامج فواتير للمنشآت في السعودية — المرحلة الأولى من زاتكا / ZATCA Phase 1 invoicing software for Saudi businesses |
| `footer.taglineAe` | فوترة عربية أولاً وجاهزية… / …for the UAE | فوترة عربية للشركات في الإمارات واستعداد للفوترة الإلكترونية / …for UAE businesses |
| Hero mock (route) | قافتر للتصميم · تصميم شعار · فاتورة ضريبية | مؤسسة قافتر التجارية · توريد وتركيب · فاتورة ضريبية مبسطة · الإجمالي شامل الضريبة |
| `support.*`, `privacy.*` | "بيانات النشاط التجاري", "لإنشاء فواتير زاتكا", "٣ فواتير شهرياً مجاناً" | "بيانات المنشأة", "لإصدار الفواتير الضريبية"; the free-plan answer now says PDF download without an account is always free; Phase 1/2 named مرحلة الإصدار والحفظ / مرحلة الربط والتكامل |

### KSA invoice tool and PDF — `src/lib/instant-invoice/copy.ts`, `invoice-pdf.ts`

| Key | Before (AR / EN) | After (AR / EN) |
|---|---|---|
| `heroCta` | أنشئ فاتورة الآن / Create invoice now | أصدر فاتورتك الأولى مجاناً / Create your first invoice free |
| `disclaimer` | …غير تابع لزاتكا (الهيئة العامة للزكاة والضريبة والجمارك) | …غير تابع لهيئة الزكاة والضريبة والجمارك (زاتكا) (official name) |
| `sellerTitle` / `sellerName` | بيانات نشاطك · اسم النشاط / Your business · Business name | بيانات البائع (منشأتك) · الاسم التجاري / Seller (your business) · Trade name |
| `sellerVat`, `previewVatTrn` (EN) | VAT number (TRN) · VAT registration (TRN) | VAT number |
| `clientTitle` / `clientName` / `clientVat` | بيانات العميل · اسم العميل · رقم ضريبي للعميل / Client… | بيانات المشتري (العميل) · اسم المشتري · الرقم الضريبي للمشتري / Buyer (customer) · Buyer name · Buyer VAT number |
| `subtotal` / `vat` / `total` | المجموع قبل الضريبة · ضريبة ١٥٪ · الإجمالي / Subtotal · Total | الإجمالي غير شامل الضريبة · ضريبة القيمة المضافة ١٥٪ · الإجمالي شامل الضريبة / Total excl. VAT · Total incl. VAT |
| `downloadPdf` (AR) | تحميل PDF | تنزيل PDF |
| Error messages | colloquial dashes, "ترقّ للبرو" | Full sentences, e.g. "بلغت حد الخطة المجانية (٣ فواتير شهرياً). رقِّ اشتراكك إلى برو." |
| PDF `from` / `to` | من / إلى · From / To | البائع / المشتري · Seller / Buyer |
| PDF `trn` | الرقم الضريبي (TRN) · VAT registration (TRN) | الرقم الضريبي · VAT number |
| PDF subtitle | Simplified Tax Invoice · ZATCA Phase 1 / ZATCA Phase 1 | Bilingual document title only (Simplified Tax Invoice / فاتورة ضريبية مبسطة) |
| PDF totals | المجموع قبل الضريبة · الإجمالي · Subtotal (excl. VAT) · Total | الإجمالي غير شامل الضريبة · الإجمالي شامل الضريبة · Total excl. VAT · Total incl. VAT |
| PDF footer | …غير تابع لزاتكا · أداة مساعدة — راجع محاسبك | …غير تابع لهيئة الزكاة والضريبة والجمارك · يُرجى مراجعتها مع محاسبك |
| WhatsApp text (AR) | فاتورة ضريبية — … الإجمالي | فاتورة ضريبية مبسطة — … الإجمالي شامل الضريبة |

### KSA tools — `src/lib/tools/copy.ts`, `fatora-faq.ts`, `src/lib/sa/wave-copy.ts`, `wave-guide-content.ts`

| Key | Before | After |
|---|---|---|
| `hub.title` | أدوات مجانية للفوترة السعودية / Free Saudi invoicing tools | أدوات فوترة مجانية للمنشآت في السعودية / Free invoicing tools for Saudi businesses |
| `tools.trn-checker.title` (EN) | TRN format checker | VAT number checker |
| `trnChecker.inputLabel` | الرقم الضريبي (TRN) / VAT registration (TRN) | الرقم الضريبي / VAT number |
| `trnChecker.status*`, `rulesTitle` | رقم ضريبي صالح · قواعد TRN في السعودية / Valid TRN format · Saudi TRN rules | صيغة الرقم الضريبي صحيحة · شروط صيغة الرقم الضريبي في السعودية / Valid VAT number format · Saudi VAT number format |
| `trnChecker.faq[0]` | ما هو TRN؟ | ما هو الرقم الضريبي في السعودية؟ It explains that ZATCA's term is "الرقم الضريبي" (VAT number) and keeps "TRN" as a search synonym |
| `vatCalculator.modeExclusive` | قبل الضريبة / Before VAT | غير شامل الضريبة / VAT exclusive |
| `vatCalculator.total` | الإجمالي / Total | الإجمالي شامل الضريبة / Total incl. VAT |
| `vatCalculator.faq[1]` | …للمستقلين / …for freelancers | …للمنشآت والمستقلين / …for businesses and freelancers |
| Wave checker title | هل أنت ضمن الموجة ٢٥؟ / Am I in ZATCA Wave 25? | هل منشأتك ضمن الموجة ٢٥؟ / Is your business in ZATCA Wave 25? |
| Wave copy and guide | (الإصدار) / (الربط), جاوب… كم يوماً باقي, "بنمط المرحلة الأولى" / "Phase 1 style" | (مرحلة الإصدار والحفظ) / (مرحلة الربط والتكامل), أجب عن… الأيام المتبقية, "وفق المرحلة الأولى" / "Phase 1 (Generation)" |
| Wave notify box | المرحلة الثانية من قافتر قادمة / Qaftr Phase 2 is coming | دعم المرحلة الثانية في قافتر قيد التطوير / Phase 2 support in Qaftr is in development |
| Wave guide (EN) | "choosing a Phase 2 ready solution provider" | "choosing an e-invoicing solution provider that supports Phase 2" |
| Fatora FAQ | 3 questions + wave | Adds a B2B/B2C business question; the freelancer question is reworded but kept (traffic) |

### UAE — `src/lib/ae/copy.ts`, `invoice-copy.ts`, `invoice-html.ts`, `guide-content.ts`

| Key | Before | After |
|---|---|---|
| `hub.title` (H1) | فوترة عربية أولاً وجاهزية… لمستقلي الإمارات… / Arabic-first invoicing and e-invoicing readiness for UAE freelancers and SMEs | استعد للفوترة الإلكترونية في الإمارات 2027 — فوترة عربية لشركتك / Get ready for UAE e-invoicing in 2027 — Arabic-first invoicing for your business |
| `hub.intro` | …قبل لا يداهمك | MSA, addresses SMEs that sell to businesses and consumers |
| `trn.inputLabel` and all AR TRN labels | الرقم الضريبي (TRN) | رقم التسجيل الضريبي (TRN) |
| Invoice form `trn` (EN) | TRN | TRN (Tax Registration Number) |
| `supplierTitle` | بيانات المورّد (أنت) / Supplier (you) | بيانات المورّد (شركتك) / Supplier (your business) |
| `recipientTitle` (EN) | Customer | Customer (recipient) |
| `issueDate` | تاريخ الإصدار / Issue date | تاريخ الفاتورة / Invoice date |
| `totalPayable` (AR), PDF total | الإجمالي المستحق | المبلغ المستحق |
| `categories` (AR) | أساسية 5٪ · نسبة صفر 0٪ | النسبة الأساسية 5٪ · نسبة الصفر 0٪ |
| PDF `recipient` (EN) | Bill to | Recipient |
| PDF `net` | المبلغ قبل الضريبة / Net amount | المبلغ الخاضع للضريبة / Taxable amount |
| PDF `vat` (line) | الضريبة / VAT | مبلغ الضريبة / VAT amount |
| VAT calculator `subtotal` | المبلغ قبل الضريبة / Amount before VAT | المبلغ الخاضع للضريبة / Taxable amount |
| Readiness title | متى تلزمك الفوترة الإلكترونية…؟ / …for you? | متى تُلزَم شركتك بالفوترة الإلكترونية في الإمارات؟ / …for your business? |
| Dialect → MSA (examples) | الخطوة الجاية · وين أكتب · تبي تذكير · خلك متابع · إذا ما سويت · ما فيه · نبلغك أول ما يصير جاهزاً | الخطوة التالية · أين يُكتب · هل تريد تذكيراً · تابع · إن لم تفعل · لا تتضمن · سنُبلغك فور إتاحته |
| Guide title | …الدليل الكامل للمستقلين والشركات الصغيرة / …for freelancers and SMEs | …الدليل الشامل للشركات والمنشآت الصغيرة والمتوسطة / …for businesses and SMEs (freelancer section kept) |
| Guide body (AR) | Gulf dialect throughout (مو، بتتغير، ما راح يكفي، يشتغل، عشان، وش…) | Rewritten in MSA. The Peppol model uses المورّد/العميل |
| `AeCrossLinkCard` (AR) | التحقق من الرقم الضريبي TRN | التحقق من رقم التسجيل الضريبي (TRN) |

### Shared components (string-only edits)

| File | Before | After |
|---|---|---|
| `MarketingStatusPages.tsx` | الرابط اللي فتحته… · صار خطأ غير متوقع · ما قدرنا نعرض… · حاول مرة ثانية | الرابط الذي فتحته… · حدث خطأ غير متوقع · تعذّر عرض هذه الصفحة… · حاول مرة أخرى |

### SEO titles and descriptions (core pages)

| Page | Before (AR / EN title) | After (AR / EN title) |
|---|---|---|
| `/` | قافتر — فاتورة زاتكا للمستقلين \| فوترة إلكترونية / Qaftr — ZATCA Invoice for Saudi Freelancers \| E-invoicing | قافتر \| برنامج فواتير زاتكا للمنشآت في السعودية / Qaftr \| ZATCA Invoicing Software for Saudi Businesses |
| `/tools` | أدوات مجانية — فواتير وضريبة زاتكا / Free Saudi invoicing tools — Qaftr (description said "for Saudi freelancers") | أدوات فوترة مجانية للمنشآت في السعودية / Free Invoicing Tools for Saudi Businesses |
| `/tools/fatora` | قافتر فاتورة ضريبية - برنامج فواتير زاتكا / Qaftr — Free ZATCA tax invoice tool (description "…للمستقلين") | فاتورة ضريبية مبسطة مجانية مع QR زاتكا / Free Simplified Tax Invoice with ZATCA QR |
| `/tools/trn-checker` | التحقق من الرقم الضريبي TRN / Saudi TRN format checker | التحقق من الرقم الضريبي السعودي / Saudi VAT Number Checker — 15-Digit Format |
| `/tools/vat-calculator` | حاسبة ضريبة ١٥٪ — السعودية / 15% VAT calculator — Saudi Arabia | حاسبة ضريبة القيمة المضافة ١٥٪ في السعودية / Saudi 15% VAT Calculator — Add or Remove VAT |
| `/tools/zatca-wave-checker` | 72-char AR title; 189-char EN description | Shortened to fit the limits and business framing |
| `/ae` | …للمستقلين… / UAE invoicing & e-invoicing tools for freelancers | الفوترة الإلكترونية للشركات في الإمارات 2027 / UAE E-invoicing 2027 for Businesses — Free Tools |
| `/ae/tools/*`, `/ae/guides/*` | several titles over 60 characters | All fit the limits; readiness and invoice-generator now say "شركتك" / "your business" |
| Landing pages (5) | "for freelancers and small businesses" | Business intent (SMEs, shops, B2B/B2C). `/free-invoice-generator` stays the freelancer channel: "برنامج فواتير مجاني للمستقلين والمتاجر" / "Free Invoice Generator for Freelancers & Shops" |
| `public/llms.txt` | "for freelancers and small businesses in Saudi Arabia"; "UAE freelancers and SMEs" | "SMEs in Saudi Arabia and the UAE that sell B2B and B2C"; states that Phase 2 is not supported yet; the UAE generator is described as a PDF tax invoice, not a Peppol / PINT AE e-invoice |

## Not changed (owned by other agents; please apply)

- `src/lib/marketing/seo.ts` (geo agent): the og:image alt text still reads `Qaftr | قافتر — ZATCA Phase 1 invoicing for Saudi freelancers` (SA) and `…readiness for UAE freelancers and SMEs` (AE). Suggested: `Qaftr | قافتر — ZATCA Phase 1 invoicing for Saudi businesses` and `Qaftr | قافتر — Arabic-first invoicing and e-invoicing readiness for UAE businesses`.
- `src/lib/marketing/constants.ts` `SEO_KEYWORDS` still lists `فاتورة للمستقلين` / `Saudi freelancer invoice`. Meta keywords carry no ranking weight, so this is cosmetic.
- Logged-in workspace screens (`src/routes/workspace/**`) were not reworded in this pass.

## Legal / regulatory statements the owner must sign off

1. **"فواتير ضريبية وفق المرحلة الأولى من زاتكا" / "ZATCA Phase 1 tax invoices"** (home H1, footer, SEO). This asserts that output meets Phase 1 (Generation) requirements. Phase 1 also prohibits certain solution behaviours, such as editable or deletable invoices and a missing sequence. Confirm before keeping "وفق" ("in line with"). The softer alternative is "بنمط المرحلة الأولى".
2. **Simplified vs standard tax invoice (product gap).** The Saudi tool and PDF only issue a **فاتورة ضريبية مبسطة** (B2C). The new B2B+B2C positioning implies businesses can invoice VAT-registered buyers, which in KSA needs a standard **فاتورة ضريبية** (buyer name, address and VAT number). Either add a standard-invoice mode or soften the B2B wording.
3. **"يُصدر قافتر فواتير وفق المرحلة الأولى… قافتر ليس تطبيقاً رسمياً تابعاً لزاتكا"** and the Phase 2 "not yet" answers (support FAQ, fatora FAQ, landing pages, wave checker, Wave 25 guide).
4. **Wave 25 facts**: threshold above SAR 187,500 in the 2022–2025 reference years, deadline 1 Feb 2027, Wave 24 due 30 Jun 2026, Wave 23 due 31 Mar 2026, mandatory VAT registration above SAR 375,000.
5. **UAE dates**: pilot 1 Jul 2026; mandatory 1 Jan 2027 (AED 50M+), 1 Jul 2027 (others), 1 Oct 2027 (government); ASP appointment 31 Jul 2026 (some sources 30 Oct 2026); B2C excluded for now.
6. **UAE simplified invoice rule**: AED 10,000 including VAT, Art. 59 of the Executive Regulation, and removal under Cabinet Decision No. 100 of 2025 once in e-invoicing scope. The VAT-inclusive reading is practitioner-sourced (spec §4).
7. **UAE TRN format**: 15 digits starting with 100. "Format check only" wording.
8. **Disclaimers**: "not affiliated with ZATCA / FTA / MoF", "not an ASP", "general guidance, not tax advice", and the PDF footer "يُرجى مراجعتها مع محاسبك".
9. **Pricing micro-copy**: "بدون بطاقة ائتمان / No credit card" (true today, since the free tier needs no card) and "٣ فواتير محفوظة شهرياً". Prices show no VAT-inclusive or VAT-exclusive note. Decide whether SAR 39 / 349 includes VAT and add the note the spec recommends.
10. **Privacy policy** wording changed slightly ("بيانات المنشأة", "لإصدار الفواتير الضريبية"). Legal should re-read it.
