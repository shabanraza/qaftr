`zatca_wave_checker` | `zatca_qr_decoder` |# Qaftr analytics (GA4 + Consent Mode v2)
`zatca_wave_checker` | `zatca_qr_decoder` |
`zatca_wave_checker` | `zatca_qr_decoder` |Code: `invoice-app/src/lib/analytics/` (config, consent, track, listeners, hook),
`zatca_wave_checker` | `zatca_qr_decoder` |`invoice-app/src/components/analytics/` (ConsentBanner, AnalyticsListeners),
`zatca_wave_checker` | `zatca_qr_decoder` |injected from `src/routes/__root.tsx`.
`zatca_wave_checker` | `zatca_qr_decoder` |
`zatca_wave_checker` | `zatca_qr_decoder` |## When GA loads
`zatca_wave_checker` | `zatca_qr_decoder` |
`zatca_wave_checker` | `zatca_qr_decoder` |GA is injected only when **both** hold (`shouldLoadAnalytics` / `isProductionHost`):
`zatca_wave_checker` | `zatca_qr_decoder` |
`zatca_wave_checker` | `zatca_qr_decoder` |- `VITE_GOOGLE_ANALYTICS_ID` (default `G-LKFPFV4QSK`) is a valid `G-XXXX` ID, and
`zatca_wave_checker` | `zatca_qr_decoder` |- the page host is the `VITE_SITE_URL` host or its `www.` variant (`qaftr.com`,
`zatca_wave_checker` | `zatca_qr_decoder` |  `www.qaftr.com`). Never on `localhost`, `127.0.0.1`, `*.localhost`, `*.workers.dev`,
`zatca_wave_checker` | `zatca_qr_decoder` |  `*.pages.dev` previews or other subdomains (e.g. staging).
`zatca_wave_checker` | `zatca_qr_decoder` |
`zatca_wave_checker` | `zatca_qr_decoder` |The check runs in a small inline `<head>` script (host list baked in at build time),
`zatca_wave_checker` | `zatca_qr_decoder` |so previews of the same build stay clean. Set `VITE_GOOGLE_ANALYTICS_ID=` (empty) to
`zatca_wave_checker` | `zatca_qr_decoder` |disable GA entirely.
`zatca_wave_checker` | `zatca_qr_decoder` |
`zatca_wave_checker` | `zatca_qr_decoder` |## Consent Mode v2
`zatca_wave_checker` | `zatca_qr_decoder` |
`zatca_wave_checker` | `zatca_qr_decoder` |Order in the head script (before gtag.js loads):
`zatca_wave_checker` | `zatca_qr_decoder` |
`zatca_wave_checker` | `zatca_qr_decoder` |1. `gtag('consent','default',{ad_storage, ad_user_data, ad_personalization, analytics_storage: 'denied', wait_for_update: 500})`, for every region.
`zatca_wave_checker` | `zatca_qr_decoder` |2. If the visitor previously accepted: `gtag('consent','update',{analytics_storage:'granted'})`.
`zatca_wave_checker` | `zatca_qr_decoder` |3. `gtag('js', …)`, `gtag('config', ID)`, then gtag.js is loaded async.
`zatca_wave_checker` | `zatca_qr_decoder` |
`zatca_wave_checker` | `zatca_qr_decoder` |This is **advanced** Consent Mode: before/without consent, GA receives cookieless
`zatca_wave_checker` | `zatca_qr_decoder` |pings only (used for GA4 behavioural modelling); no `_ga` cookies are set.
`zatca_wave_checker` | `zatca_qr_decoder` |
`zatca_wave_checker` | `zatca_qr_decoder` |Banner (`ConsentBanner`): bottom, fixed (no layout shift), client-only, AR/EN with
`zatca_wave_checker` | `zatca_qr_decoder` |correct `dir`, Accept and Reject with identical styling. Shown only when GA actually
`zatca_wave_checker` | `zatca_qr_decoder` |loaded and no choice is stored. Choice is stored in `localStorage`
`zatca_wave_checker` | `zatca_qr_decoder` |(`qaftr:analytics-consent` = `granted` | `denied`, wrapped in try/catch; if storage
`zatca_wave_checker` | `zatca_qr_decoder` |is blocked the banner simply asks again next visit).
`zatca_wave_checker` | `zatca_qr_decoder` |
`zatca_wave_checker` | `zatca_qr_decoder` |- Accept → `consent update {analytics_storage: 'granted'}`. Ad signals stay denied
`zatca_wave_checker` | `zatca_qr_decoder` |  (Qaftr runs no ads; revisit if Google Ads is added).
`zatca_wave_checker` | `zatca_qr_decoder` |- Reject → all four signals `denied`.
`zatca_wave_checker` | `zatca_qr_decoder` |
`zatca_wave_checker` | `zatca_qr_decoder` |To let visitors change their mind later, clear the key (a "Cookie settings" link
`zatca_wave_checker` | `zatca_qr_decoder` |calling `localStorage.removeItem('qaftr:analytics-consent')` + reload would do).
`zatca_wave_checker` | `zatca_qr_decoder` |
`zatca_wave_checker` | `zatca_qr_decoder` |## Events
`zatca_wave_checker` | `zatca_qr_decoder` |
`zatca_wave_checker` | `zatca_qr_decoder` |Every event automatically gets `region` (`sa` | `ae`, from `/ae`) and `lang`
`zatca_wave_checker` | `zatca_qr_decoder` |(`ar` | `en`, from `?lang`). Params are categories/counts only: `track()` drops
`zatca_wave_checker` | `zatca_qr_decoder` |keys like name/email/phone/trn/address and any string containing an email or
`zatca_wave_checker` | `zatca_qr_decoder` |9+ digit run. Never send names, emails, TRNs, invoice numbers or amounts.
`zatca_wave_checker` | `zatca_qr_decoder` |
`zatca_wave_checker` | `zatca_qr_decoder` || Event | Params | Fired when |
`zatca_wave_checker` | `zatca_qr_decoder` || --- | --- | --- |
`zatca_wave_checker` | `zatca_qr_decoder` || `invoice_pdf_download` | `tool` (`home_instant` \| `fatora` \| `workspace` \| `uae_invoice_generator`), `invoice_type` (`simplified` \| `full`), `line_count`, `currency` (`SAR` \| `AED`) | PDF generated successfully (home instant invoice, `/tools/fatora`, workspace new invoice, `/ae/tools/invoice-generator`) |
`zatca_wave_checker` | `zatca_qr_decoder` || `document_pdf_download` | `tool` (`receipt_voucher` \| `quotation` \| `credit_note` \| `non_tax_invoice`), `output_lang` (`ar` \| `en` \| `bilingual`), `currency` (`SAR`), `line_count` (quotation, credit note, non-tax invoice), `payment_method` (receipt: `cash` \| `bank_transfer` \| `cheque` \| `card`), `reason` (credit note: Article 40(1) case code) | PDF generated on `/tools/receipt-voucher`, `/tools/quotation`, `/tools/credit-note`, `/tools/non-tax-invoice`. The non-tax invoice "Create a tax invoice" link sends `cta_click` with `cta=non_tax_to_tax_invoice`. The quotation "Convert to tax invoice" link sends `cta_click` with `cta=quotation_to_invoice` |
`zatca_wave_checker` | `zatca_qr_decoder` || `invoice_save_click` | `tool`, `signed_in` (bool) | "Save" clicked on a valid draft (Saudi instant invoice) |
`zatca_wave_checker` | `zatca_qr_decoder` || `sign_up` | `method` (`email`), `source` (`invoice` \| `general`) | `authClient.signUp.email` returned without error in `AuthGateDialog` (UI layer; auth internals untouched) |
`zatca_wave_checker` | `zatca_qr_decoder` || `tool_used` | `tool` (`vat_calculator` \| `trn_checker` \| `zatca_wave_checker`, `zatca_qr_decoder` \| `uae_vat_calculator` \| `uae_trn_checker` \| `uae_readiness_quiz`), `result` (mode / `valid`/`invalid` / status or phase; QR decoder: `phase1_ok` | `phase1_issues` | `phase2_ok` | `phase2_issues` | `invalid`) | Live tools (calculators, TRN checkers): once a result has been stable for 1.5 s, and not again for the same result. Submit tools (wave checker, readiness quiz): on each submitted result |
`zatca_wave_checker` | `zatca_qr_decoder` || `cta_click` | `cta` (link path/hash or `data-cta` name), `cta_location` (`header` \| `nav` \| `main` \| `footer` \| `dialog` \| `page`) | Click on any `.qaftr-btn-primary` or `[data-cta]` element (one delegated listener; add `data-cta="name"` to tag more) |
`zatca_wave_checker` | `zatca_qr_decoder` || `language_switch` | `from`, `to` | A navigation changes `?lang` |
`zatca_wave_checker` | `zatca_qr_decoder` || `region_switch` | `from`, `to` | A navigation moves between Saudi and `/ae` |
`zatca_wave_checker` | `zatca_qr_decoder` |
`zatca_wave_checker` | `zatca_qr_decoder` |Page views: GA4 enhanced measurement ("Page changes based on browser history
`zatca_wave_checker` | `zatca_qr_decoder` |events") records SPA navigations; keep it on.
`zatca_wave_checker` | `zatca_qr_decoder` |
`zatca_wave_checker` | `zatca_qr_decoder` |### Key events (GA4 Admin → Data display → Events → mark as key event)
`zatca_wave_checker` | `zatca_qr_decoder` |
`zatca_wave_checker` | `zatca_qr_decoder` |- `invoice_pdf_download`
`zatca_wave_checker` | `zatca_qr_decoder` |- `document_pdf_download`
`zatca_wave_checker` | `zatca_qr_decoder` |- `sign_up`
`zatca_wave_checker` | `zatca_qr_decoder` |- `invoice_save_click`
`zatca_wave_checker` | `zatca_qr_decoder` |
`zatca_wave_checker` | `zatca_qr_decoder` |Register custom dimensions (Admin → Custom definitions, event scope) for `region`,
`zatca_wave_checker` | `zatca_qr_decoder` |`lang`, `tool`, `invoice_type`, `currency`, `cta`, `cta_location`, `result`, `output_lang`, `payment_method`, `reason`, and a
`zatca_wave_checker` | `zatca_qr_decoder` |custom metric for `line_count`, otherwise they are not reportable.
`zatca_wave_checker` | `zatca_qr_decoder` |
`zatca_wave_checker` | `zatca_qr_decoder` |## Link GA4 ↔ Search Console
`zatca_wave_checker` | `zatca_qr_decoder` |
`zatca_wave_checker` | `zatca_qr_decoder` |1. Search Console: the `qaftr.com` property must be verified (meta tag
`zatca_wave_checker` | `zatca_qr_decoder` |   `google-site-verification` is already in the root head).
`zatca_wave_checker` | `zatca_qr_decoder` |2. GA4 → Admin → Product links → Search Console links → Link → choose the property
`zatca_wave_checker` | `zatca_qr_decoder` |   → choose the web stream → Submit. Requires GA4 Editor + Search Console owner.
`zatca_wave_checker` | `zatca_qr_decoder` |3. Reports → Library → publish the "Search Console" collection. Data appears after ~48 h.
`zatca_wave_checker` | `zatca_qr_decoder` |
`zatca_wave_checker` | `zatca_qr_decoder` |## Verify with DebugView
`zatca_wave_checker` | `zatca_qr_decoder` |
`zatca_wave_checker` | `zatca_qr_decoder` |GA does not run on localhost/previews by design. To verify:
`zatca_wave_checker` | `zatca_qr_decoder` |
`zatca_wave_checker` | `zatca_qr_decoder` |- **Production**: install the "Google Analytics Debugger" Chrome extension (it turns
`zatca_wave_checker` | `zatca_qr_decoder` |  on `debug_mode` for your browser only), open https://qaftr.com, accept cookies, then GA4 → Admin → DebugView. Download an
`zatca_wave_checker` | `zatca_qr_decoder` |  invoice, use a tool, switch language; each event should appear with `region`/`lang`.
`zatca_wave_checker` | `zatca_qr_decoder` |  Also check Realtime.
`zatca_wave_checker` | `zatca_qr_decoder` |- **Consent**: DevTools → Application → Local Storage → delete
`zatca_wave_checker` | `zatca_qr_decoder` |  `qaftr:analytics-consent`, reload: the banner reappears. In the Network tab,
`zatca_wave_checker` | `zatca_qr_decoder` |  `collect?` hits carry `gcs=G100` (denied) before accepting and `gcs=G101`
`zatca_wave_checker` | `zatca_qr_decoder` |  after accepting analytics. Tag Assistant (tagassistant.google.com) shows the
`zatca_wave_checker` | `zatca_qr_decoder` |  consent state per hit.
`zatca_wave_checker` | `zatca_qr_decoder` |- **Locally / CI**: `e2e/analytics.spec.ts` sets `window.__qaftrAnalyticsForce = true`
`zatca_wave_checker` | `zatca_qr_decoder` |  before load to run the bootstrap on localhost (gtag.js is stubbed by
`zatca_wave_checker` | `zatca_qr_decoder` |  `e2e/fixtures.ts`) and asserts on `window.dataLayer`. Setting the flag from the
`zatca_wave_checker` | `zatca_qr_decoder` |  console after load is too late; use the spec (`bun run e2e -- -g analytics`).
