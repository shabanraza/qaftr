# Qaftr Arabic Free Tools Roadmap

Arabic-first free utilities for Saudi freelancers and small businesses. Each tool targets SEO keywords from [MARKETING.md](./MARKETING.md).

## Live

| Tool | URL | Primary keyword |
|------|-----|-----------------|
| Instant invoice | `/` `#invoice-tool`, `/tools/fatora` | فاتورة ضريبية · برنامج فواتير مجاني |
| VAT calculator | `/tools/vat-calculator` | حاسبة ضريبة 15٪ · VAT calculator KSA |
| TRN checker | `/tools/trn-checker` | التحقق من الرقم الضريبي · TRN format |
| Tools hub | `/tools` | أدوات مجانية · free Saudi invoicing tools |

**Model:** Create + PDF free without login. Save/manage requires signup (3 invoices/month on free plan).

## Next (priority order)

| Priority | Tool | Arabic hook | Build effort | SEO value |
|----------|------|-------------|--------------|-----------|
| 1 | ZATCA QR reader | قارئ QR فاتورة زاتكا | Medium | Matches secondary English keywords |
| 2 | QR validator | تحقق من QR الفاتورة | Medium | Trust / checker pattern |
| 3 | Invoice template gallery | نموذج فاتورة ضريبية PDF | Low | Template SEO, link magnet |
| 4 | Due date helper | موعد استحقاق الفاتورة | Low | Simple calculator |

## Hub structure

- Index: `/tools` — Arabic directory of all free tools
- Slug pattern: `/tools/{slug}` (e.g. `/tools/hasabat-dareeba` for VAT calculator)
- Shared: [MarketingLayout](../invoice-app/src/components/marketing/MarketingLayout.tsx), [BRAND](../invoice-app/src/lib/marketing/constants.ts), client-side compute via `@zatca/shared` where applicable

## Principles

1. **Arabic UI first** — tool interfaces in Arabic; English marketing wrapper optional
2. **No login for core utility** — signup only when persistence adds value
3. **Client-side when possible** — privacy + zero marginal cost
4. **ZATCA disclaimer** — never imply government affiliation
5. **Funnel to Qaftr app** — save/manage, unlimited invoices, clients, branding (Pro)
