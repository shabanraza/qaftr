# Qaftr Flow QA Report

Date: 2026-06-22

## Environment

- App: `invoice-app`
- Local URL: `http://localhost:9000`
- Database: existing Neon project `zatca-invoice`, database `neondb`, branch `main`
- Local env file created: `invoice-app/.env.local`
- New Neon database created: no

## Verification Summary

Passed:
- Accessed Neon portal and used the existing `zatca-invoice` project configuration.
- Installed workspace dependencies with Bun.
- Ran Drizzle migrations successfully against the existing Neon database.
- Built production client and SSR bundles successfully.
- Ran shared package tests: 17 passing tests.
- Started local dev server on port 9000 with `.env.local`.
- Loaded the landing page and invoice form.
- Filled a realistic Saudi invoice draft with valid VAT/TRN data.
- PDF export path loaded `html2canvas` and `jspdf` with no app validation error.
- Save flow opened the auth gate correctly when no user session existed.
- Created a throwaway QA account after user confirmation.
- Saved invoice `INV-001` and opened the saved invoice detail page:
  - invoice id: `5c07e5f1-8dcc-4b4c-bf12-12c4d9a6c26d`
  - total: `1,150.00 SAR`
  - client: `Acme Saudi LLC`
- Verified Neon persisted the QA account, one invoice, and one client.
- Direct `/workspace/` navigation renders the Money Desk dashboard with the saved invoice.
- Direct saved invoice URL renders the invoice detail with no console errors.
- Public tool pages loaded:
  - `/tools/vat-calculator`
  - `/tools/trn-checker`
  - `/tools/fatora`
- VAT calculator correctly rendered:
  - base: `1,000.00 SAR`
  - VAT: `150.00 SAR`
  - total: `1,150.00 SAR`
- TRN checker accepted `300000000000003` and showed valid-rule checks.
- `/tools/trn-checker` metadata is specific to TRN validation.

Fixed During QA:
- Removed the invoice-tool hydration mismatch caused by reading browser draft storage during the initial client render.
- Prevented protected routes from redirecting/throwing during server-side route loading before the browser auth session is available.
- Prevented protected route data loaders from server-prefetching authenticated tRPC queries without a session context.

Known Limitations:
- `bun --env-file=.env.local run test` for `invoice-app` fails before test execution due to a Cloudflare Vite plugin incompatibility with Vitest/Vite startup options. Production build succeeds.
- Headless PDF click did not expose a visible file in `~/Downloads`; the app did not show a user-facing error, and required PDF libraries loaded. A headed-browser/manual download check is still the best confirmation for the saved file itself.
- `pg` prints an SSL warning that `sslmode=require` is currently treated as `verify-full`; migrations and DB checks still succeeded.

Artifacts:
- `.gstack/qa-reports/screenshots/qaftr-initial.png`
- `.gstack/qa-reports/screenshots/qaftr-filled-invoice.png`
- `.gstack/qa-reports/screenshots/qaftr-after-pdf-click.png`
- `.gstack/qa-reports/screenshots/qaftr-auth-gate.png`
