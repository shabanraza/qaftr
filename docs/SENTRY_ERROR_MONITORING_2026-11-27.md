# Error monitoring (Sentry), web app

Status 2026-11-27: code ready, **off** until a DSN is set. The Sentry project `qaftr-web` exists in the
`hisaab-kro` organisation (EU region); no alert rule was added by us.

## What is captured

| Where | What | `source` tag |
|---|---|---|
| Browser | uncaught errors, unhandled rejections, errors shown by a route error page | none |
| Worker | unexpected tRPC errors (with the procedure name) | `trpc` |
| Worker | thrown errors in API routes; 5xx from `/api/auth` and webhooks | `request` |
| Worker | errors thrown in server functions | `server_fn` |
| Worker | page loader errors during server rendering | `ssr` |
| Worker | ZATCA resend cron crash; anything uncaught | `cron`, none |

Not captured: errors a route handles itself and only logs (`console.error` / `console.warn`, for
example a single failed ZATCA submit in the sweep); a React error thrown during server rendering
(the browser reports it when it renders the page); the mobile app.

Browser errors are sent **only after the visitor accepts cookies** in the existing banner, and stop
as soon as consent is withdrawn. The banner only appears where Google Analytics runs (the
production host with a measurement ID). Server errors do not depend on consent.

## What is never sent

Events are rebuilt from an allowlist (`invoice-app/src/lib/observability/scrub.ts`): no request
bodies, cookies, headers (except the browser's User-Agent), user or IP, breadcrumbs, local
variables or extra data. Query strings and id-like path segments are removed. In error messages,
SQL and its parameters, emails, numbers of 6+ digits (VAT, CR, phone), tokens, quoted values and
Arabic text are redacted. Tracing, session replay, logs and session tracking are off.

Limit: a customer name written **unquoted, in Latin letters** (or quoted but containing an
apostrophe, like O'Brien) inside a custom error message may not be detected. Do not put names in
error messages.

## Settings to add

1. Project: `hisaab-kro` / `qaftr-web` (created). Its DSN is under Settings > Client Keys (DSN).
2. Done 2026-11-27: **Data Scrubber** and **Prevent Storing of IP Addresses** are on.
3. Production is built by **Cloudflare Workers Builds** from GitHub (`main` deploys; other branches
   upload a preview version), so settings go in Worker `tanstack-start-app` > Settings > Builds >
   Variables and secrets. Present on 2026-11-27:

   - `VITE_SENTRY_DSN` (variable): the one value covers browser and Worker.
   - `SENTRY_AUTH_TOKEN` (secret, organisation token): turns on source map upload. Maps are deleted
     from `dist` after upload, and a failed upload fails the build.

   Optional: `SENTRY_ORG` / `SENTRY_PROJECT` (default `hisaab-kro` / `qaftr-web`) and
   `VITE_SENTRY_ENVIRONMENT` (default `production`, so preview versions report as production too
   unless it is set). Worker variables `SENTRY_DSN` / `SENTRY_ENVIRONMENT` override the Worker side.

   For a local build, use the gitignored `invoice-app/.env.local` and
   `invoice-app/.env.sentry-build-plugin` instead.

The release is `qaftr-web@<git commit>` (override with `SENTRY_RELEASE` at build time). Nothing is
sent in `vite dev` or tests, or from localhost unless an environment is named.

## Privacy wording

Added 2026-11-27: an "Error monitoring" / «مراقبة الأعطال» section in the privacy policy
(`invoice-app/src/lib/marketing/i18n.ts`) and error reports in the cookie banner
(`invoice-app/src/lib/analytics/consent-copy.ts`).

Still open (owner):

- Accept Sentry's Data Processing Amendment (Sentry > Settings > Legal & Compliance). Not accepted
  as of 2026-11-27.
- Legal review of the wording, including the PDPL transfer outside Saudi Arabia (data is stored in
  the EU). The organisation is on the Developer plan (30-day error retention) with a Business trial
  until 2026-12-09 (90 days), so "no longer than 90 days" holds for both.
- People who accepted the old banner have not agreed to error reports. If that matters, change
  `CONSENT_STORAGE_KEY` so the banner asks again (this also asks again for analytics).
- The privacy policy does not name Google Analytics.
