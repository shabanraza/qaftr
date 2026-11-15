# Landing page redesign, keywords and SEO pages — 2026-11-15

Builds on `MARKET_SEO_AUDIT_2026-11-08.md` (keyword clusters, competitor gaps), `COMPETITOR_UX_SPEC_2026-11-09.md` (section patterns, wording) and `REGULATORY_CLAIMS_2026-11-13.md` (verified tax statements). Audience: Saudi SMEs selling B2B and B2C. Phase 2 is in private beta (simulation environment), so no page may say it is available, ready, compliant or approved.

## 1. Keyword clusters → owner page

No paid volume tool was used. Priority comes from SERP inspection (who ranks, what intent) on 2026-11-15 plus the 2026-11-08 audit.

| Cluster | Arabic seeds | English seeds | Intent | Who ranks today | Owner page |
|---|---|---|---|---|---|
| Invoicing software (commercial) | برنامج فواتير · برنامج فواتير مجاني · برنامج فاتورة إلكترونية · برنامج الفاتورة الإلكترونية السعودية | invoicing software Saudi Arabia · e-invoicing software KSA | Commercial | Daftra, Qoyod, Wafeq product pages | **NEW** `/invoicing-software-saudi-arabia` |
| Software comparison | أفضل برنامج فواتير · مقارنة برامج الفوترة الإلكترونية · بديل قيود / وافق / دفترة | best e-invoicing software Saudi small business · Qoyod vs Wafeq · ZATCA software price | Commercial investigation | Vendor "X vs Y" pages (Wafeq), review sites, Tally cost articles | **NEW** `/e-invoicing-software-comparison-saudi-arabia` (table) |
| Tax invoice requirements | متطلبات الفاتورة الضريبية · شروط الفاتورة الضريبية · الحقول الإلزامية في الفاتورة الضريبية | Saudi VAT invoice requirements · mandatory fields tax invoice KSA | Informational | Qoyod blog, ClearTax, Tally, ZATCA PDFs | **NEW** `/guides/saudi-tax-invoice-requirements` |
| Standard vs simplified | الفرق بين الفاتورة الضريبية والمبسطة · فاتورة ضريبية مبسطة · التخليص والإبلاغ | standard vs simplified tax invoice · clearance vs reporting ZATCA | Informational | Qoyod KB, Dariba, Invopop docs | **NEW** `/guides/tax-invoice-vs-simplified-invoice` |
| Wave 25 / Phase 2 | الموجة 25 · المرحلة الثانية زاتكا · ربط الفوترة الإلكترونية | zatca wave 25 · zatca phase 2 small business | Info → commercial | Qoyod, ClearTax, Wafeq news posts | existing `/guides/zatca-wave-25` + `/tools/zatca-wave-checker` |
| Free tax invoice | فاتورة ضريبية · فاتورة ضريبية pdf · إنشاء فاتورة أون لاين | free invoice generator Saudi | Transactional | Wafeq "create invoice online", thin generators | existing `/` demo + `/tools/fatora` |
| Guides hub | دليل الفوترة الإلكترونية | Saudi e-invoicing guides | Navigational | — | **NEW** `/guides` |

## 2. Landing page (`/`) section order

Standard SaaS landing order, demo first:

1. **Hero + live demo**: kicker, Phase 1 H1 (unchanged), one-line value, primary CTA to the demo, secondary to sign up, trust chips. The real invoice tool sits directly under the hero text — no fake mock.
2. **Bento grid**: one large tile (QR + PDF + WhatsApp), mid tiles (Arabic-first, automatic 15% VAT, credit and debit notes, Phase 2 private beta), small tiles (accountant export, free tools).
3. **How it works**: 3 steps.
4. **Comparison table**: Qaftr vs full accounting suites vs free template sites (categories, not brand claims; suite price range from published pricing, Nov 2026).
5. **Pricing**.
6. **Guides and tools**: links to the SEO pages and guides (internal linking).
7. **FAQ** with FAQPage JSON-LD.
8. **Final CTA**.

Footer gains link columns (Guides, Tools, Solutions) so every page links to the SEO pages.

## 3. Comparison facts and sources

| Row | Qaftr | Full accounting suites | Free template sites |
|---|---|---|---|
| Starting price | Free plan; Pro SAR 39/month | About SAR 99–199/month on entry plans ([Wafeq vs Qoyod](https://www.wafeq.com/en/wafeq-vs-qoyod), [Qoyod pricing guide](https://www.qoyod.com/en/blog/business-knowledge/e-invoice-pricing-saudi-arabia/)) | Free |
| Free trial / no sign-up | First invoice without an account | 14-day trial ([Wafeq](https://wafeq.com/ar-sa)) | No account |
| Phase 2 | Private beta | Included on paid plans (e.g. Wafeq Plus, Qoyod Pro) | No |

## 4. Guardrails

- Copy test (`copy-positioning.test.ts`) scans the new home, guide and comparison modules for forbidden trust claims and checks Phase 2 answers say private beta.
- Tax statements in the guides only use items from `REGULATORY_CLAIMS_2026-11-13.md` or ZATCA guideline wording.
