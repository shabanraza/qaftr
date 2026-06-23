# Qaftr Language, Client, and SEO QA Report

Date: 2026-06-23

## Scope

- Keep English mode consistent across public pages, workspace pages, links, and redirects.
- Add a top-level client creation option on the Clients page.
- Wire the recent SEO plan into crawl/discovery and Google measurement setup.

## Fixes

- Preserved `?lang=en` on saved invoice redirects from the invoice tool.
- Preserved `?lang=en` on public saved-invoices "New invoice" links.
- Preserved `?lang=en` on the empty workspace "Create invoice" link.
- Added a top Add client action and inline create-client form to `/workspace/clients`.
- Added env-driven Google Search Console verification through `VITE_GOOGLE_SITE_VERIFICATION`.
- Added env-driven Google Analytics 4 gtag through `VITE_GOOGLE_ANALYTICS_ID`.
- Added default Google Search Console and Google Analytics identifiers so production emits them even without extra env configuration.
- Added Google Search Console HTML verification file at `/googlecf5503f94336ac1c.html`.
- Added `public/sitemap.xml`.
- Updated `robots.txt` to advertise `https://qaftr.com/sitemap.xml`.
- Updated the SEO plan with deployment/env steps for GSC and GA4.

## Browser QA

Passed:
- `/` with `?lang=en` renders English copy and no console errors.
- `/invoices?lang=en` renders English copy and its New invoice link goes to `/?lang=en#invoice-tool`.
- `/workspace/clients?lang=en` renders English copy and shows Add client at the top.
- Created a QA client from `/workspace/clients?lang=en`; the client persisted and the page stayed English.
- `/workspace/new-invoice?lang=en` renders English copy from the workspace New invoice link.
- Saving an English workspace invoice redirected to `/workspace/invoices/:id?lang=en`.
- Direct reload of the saved invoice detail stayed English and had no console errors.
- English sweep had no console errors for:
  - `/tools?lang=en`
  - `/tools/fatora?lang=en`
  - `/workspace?lang=en`
  - `/workspace/invoices?lang=en`
  - `/workspace/quotes?lang=en`
  - `/workspace/clients?lang=en`
  - `/workspace/whatsapp?lang=en`
  - `/workspace/accountant?lang=en`

Verification:
- `bun --env-file=.env.local run build` passed.
- `packages/shared`: `bun test` passed with 17 tests.

## Google Search Console / Analytics Status

Code-side setup is complete and browser-side Google setup was started under `shaban.razaa@gmail.com`:
- Search Console URL-prefix property was started for `https://qaftr.com`.
- Search Console verification file added: `https://qaftr.com/googlecf5503f94336ac1c.html`.
- Search Console meta verification fallback added through `GOOGLE_SITE_VERIFICATION`.
- GA4 property `Qaftr` was created with Saudi Arabia time zone and SAR currency.
- GA4 web stream `Qaftr Web` was created for `https://qaftr.com`.
- GA4 Measurement ID wired into the app as `G-LKFPFV4QSK`.

Remaining account-side activation after deployment:
- Deploy the updated app.
- Confirm `https://qaftr.com/googlecf5503f94336ac1c.html` is live, then click Verify in Search Console.
- Submit `https://qaftr.com/sitemap.xml` in Search Console after verification.
- Wait up to 48 hours for GA4 data collection to change from pending to active.
