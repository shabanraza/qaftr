# Qaftr analytics (GA4 + Consent Mode v2)

Code: `invoice-app/src/lib/analytics/` (config, consent, track, listeners, hook),
`invoice-app/src/components/analytics/` (ConsentBanner, AnalyticsListeners),
injected from `src/routes/__root.tsx`.

## When GA loads

GA is injected only when **both** hold (`shouldLoadAnalytics` / `isProductionHost`):

- `VITE_GOOGLE_ANALYTICS_ID` (default `G-LKFPFV4QSK`) is a valid `G-XXXX` ID, and
- the page host is the `VITE_SITE_URL` host or its `www.` variant (`qaftr.com`,
  `www.qaftr.com`). Never on `localhost`, `127.0.0.1`, `*.localhost`, `*.workers.dev`,
  `*.pages.dev` previews or other subdomains (e.g. staging).

The check runs in a small inline `<head>` script (host list baked in at build time),
so previews of the same build stay clean. Set `VITE_GOOGLE_ANALYTICS_ID=` (empty) to
disable GA entirely.

## Consent Mode v2

Order in the head script (before gtag.js loads):

1. `gtag('consent','default',{ad_storage, ad_user_data, ad_personalization, analytics_storage: 'denied', wait_for_update: 500})`, for every region.
2. If the visitor previously accepted: `gtag('consent','update',{analytics_storage:'granted'})`.
3. `gtag('js', …)`, `gtag('config', ID)`, then gtag.js is loaded async.

This is **advanced** Consent Mode: before/without consent, GA receives cookieless
pings only (used for GA4 behavioural modelling); no `_ga` cookies are set.

Banner (`ConsentBanner`): bottom, fixed (no layout shift), client-only, AR/EN with
correct `dir`, Accept and Reject with identical styling. Shown only when GA actually
loaded and no choice is stored. Choice is stored in `localStorage`
(`qaftr:analytics-consent` = `granted` | `denied`, wrapped in try/catch; if storage
is blocked the banner simply asks again next visit).

- Accept → `consent update {analytics_storage: 'granted'}`. Ad signals stay denied
  (Qaftr runs no ads; revisit if Google Ads is added).
- Reject → all four signals `denied`.

To let visitors change their mind later, clear the key (a "Cookie settings" link
calling `localStorage.removeItem('qaftr:analytics-consent')` + reload would do).

## Events

Every event automatically gets `region` (`sa` | `ae`, from `/ae`) and `lang`
(`ar` | `en`, from `?lang`). Params are categories/counts only: `track()` drops
keys like name/email/phone/trn/address and any string containing an email or
9+ digit run. Never send names, emails, TRNs, invoice numbers or amounts.

| Event | Params | Fired when |
| --- | --- | --- |
| `invoice_pdf_download` | `tool` (`home_instant` \| `fatora` \| `workspace` \| `uae_invoice_generator`), `invoice_type` (`simplified` \| `full`), `line_count`, `currency` (`SAR` \| `AED`) | PDF generated successfully (home instant invoice, `/tools/fatora`, workspace new invoice, `/ae/tools/invoice-generator`) |
| `document_pdf_download` | `tool` (`receipt_voucher` \| `quotation` \| `credit_note` \| `non_tax_invoice`), `output_lang` (`ar` \| `en` \| `bilingual`), `currency` (`SAR`), `line_count` (quotation, credit note, non-tax invoice), `payment_method` (receipt: `cash` \| `bank_transfer` \| `cheque` \| `card`), `reason` (credit note: Article 40(1) case code) | PDF generated on `/tools/receipt-voucher`, `/tools/quotation`, `/tools/credit-note`, `/tools/non-tax-invoice`. The non-tax invoice "Create a tax invoice" link sends `cta_click` with `cta=non_tax_to_tax_invoice`. The quotation "Convert to tax invoice" link sends `cta_click` with `cta=quotation_to_invoice` |
| `invoice_save_click` | `tool`, `signed_in` (bool) | "Save" clicked on a valid draft (Saudi instant invoice) |
| `sign_up` | `method` (`email`), `source` (`invoice` \| `general`) | `authClient.signUp.email` returned without error in `AuthGateDialog` (UI layer; auth internals untouched) |
| `tool_used` | `tool` (`vat_calculator` \| `trn_checker` \| `zatca_wave_checker` \| `uae_vat_calculator` \| `uae_trn_checker` \| `uae_readiness_quiz`), `result` (mode / `valid`/`invalid` / status or phase) | Live tools (calculators, TRN checkers): once a result has been stable for 1.5 s, and not again for the same result. Submit tools (wave checker, readiness quiz): on each submitted result |
| `cta_click` | `cta` (link path/hash or `data-cta` name), `cta_location` (`header` \| `nav` \| `main` \| `footer` \| `dialog` \| `page`) | Click on any `.qaftr-btn-primary` or `[data-cta]` element (one delegated listener; add `data-cta="name"` to tag more) |
| `language_switch` | `from`, `to` | A navigation changes `?lang` |
| `region_switch` | `from`, `to` | A navigation moves between Saudi and `/ae` |

Page views: GA4 enhanced measurement ("Page changes based on browser history
events") records SPA navigations; keep it on.

### Key events (GA4 Admin → Data display → Events → mark as key event)

- `invoice_pdf_download`
- `document_pdf_download`
- `sign_up`
- `invoice_save_click`

Register custom dimensions (Admin → Custom definitions, event scope) for `region`,
`lang`, `tool`, `invoice_type`, `currency`, `cta`, `cta_location`, `result`, `output_lang`, `payment_method`, `reason`, and a
custom metric for `line_count`, otherwise they are not reportable.

## Link GA4 ↔ Search Console

1. Search Console: the `qaftr.com` property must be verified (meta tag
   `google-site-verification` is already in the root head).
2. GA4 → Admin → Product links → Search Console links → Link → choose the property
   → choose the web stream → Submit. Requires GA4 Editor + Search Console owner.
3. Reports → Library → publish the "Search Console" collection. Data appears after ~48 h.

## Verify with DebugView

GA does not run on localhost/previews by design. To verify:

- **Production**: install the "Google Analytics Debugger" Chrome extension (it turns
  on `debug_mode` for your browser only), open https://qaftr.com, accept cookies, then GA4 → Admin → DebugView. Download an
  invoice, use a tool, switch language; each event should appear with `region`/`lang`.
  Also check Realtime.
- **Consent**: DevTools → Application → Local Storage → delete
  `qaftr:analytics-consent`, reload: the banner reappears. In the Network tab,
  `collect?` hits carry `gcs=G100` (denied) before accepting and `gcs=G101`
  after accepting analytics. Tag Assistant (tagassistant.google.com) shows the
  consent state per hit.
- **Locally / CI**: `e2e/analytics.spec.ts` sets `window.__qaftrAnalyticsForce = true`
  before load to run the bootstrap on localhost (gtag.js is stubbed by
  `e2e/fixtures.ts`) and asserts on `window.dataLayer`. Setting the flag from the
  console after load is too late; use the spec (`bun run e2e -- -g analytics`).
