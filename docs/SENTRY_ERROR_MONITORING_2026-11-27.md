# Error monitoring (Sentry), web app

Status 2026-11-27: code ready, **off** until a DSN is set. No Qaftr Sentry project exists yet
(the `hisaab-kro` organisation, EU region, only has `hisaabkro-web`).

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

1. Create a Sentry project (platform: Cloudflare or JavaScript) in `hisaab-kro`, for example `qaftr-web`.
2. In that project: Settings > Security & Privacy: turn on **Data Scrubber** and
   **Prevent Storing of IP Addresses**.
3. `invoice-app/.env.local` (gitignored), then build and deploy:

   ```
   VITE_SENTRY_DSN=<the project DSN>
   ```

   The one value covers browser and Worker. Optional: `VITE_SENTRY_ENVIRONMENT` (default
   `production`). Worker variables `SENTRY_DSN` / `SENTRY_ENVIRONMENT` override the Worker side only.
4. Source maps (optional), in `invoice-app/.env.sentry-build-plugin` (gitignored, loaded by neither
   Vite nor Wrangler):

   ```
   SENTRY_AUTH_TOKEN=<organisation auth token>
   SENTRY_ORG=hisaab-kro
   SENTRY_PROJECT=qaftr-web
   ```

   With all three set, the build uploads source maps and deletes them from `dist`. A failed upload
   fails the build: do not deploy that output.

The release is `qaftr-web@<git commit>` (override with `SENTRY_RELEASE` at build time). Nothing is
sent in `vite dev` or tests, or from localhost unless an environment is named.

## Privacy wording to change before adding the DSN (needs your / legal sign-off)

Not changed in code. Files: `invoice-app/src/lib/marketing/i18n.ts` (privacy, `ar` and `en`, and the
"updated" date) and `invoice-app/src/lib/analytics/consent-copy.ts`.

**1. New privacy section, "Error monitoring" / «مراقبة الأعطال»**

> **EN:** We use Sentry (Functional Software, Inc.) to find and fix errors in Qaftr. When something
> fails, Sentry receives technical details: the error and where in our code it happened, the page or
> service address without query parameters or record identifiers, the app version, and the browser
> type. Our software removes request contents, cookies, sign-in data, email addresses and tax numbers
> before sending, and does not record your screen. Errors in your browser are sent only if you accept
> cookies; errors on our servers are always recorded. Your browser connects to Sentry directly, so
> Sentry receives your IP address when a report is sent; we configure it not to store it. The data is
> stored in the European Union and kept for up to 90 days.

> **AR:** نستخدم خدمة Sentry (شركة Functional Software, Inc.) لاكتشاف أعطال قافتر وإصلاحها. عند حدوث
> عطل تستلم Sentry تفاصيل تقنية: نص الخطأ وموضعه في برمجياتنا، وعنوان الصفحة أو الخدمة دون معاملات
> الرابط أو معرّفات السجلات، وإصدار التطبيق، ونوع المتصفح. يحذف نظامنا قبل الإرسال محتوى الطلبات
> وملفات تعريف الارتباط وبيانات الدخول وعناوين البريد الإلكتروني والأرقام الضريبية، ولا نسجّل شاشتك.
> لا تُرسل أعطال المتصفح إلا إذا قبلت ملفات تعريف الارتباط، أما أعطال خوادمنا فتُسجَّل دائماً. يتصل
> متصفحك بخدمة Sentry مباشرة، فيصلها عنوان IP عند إرسال التقرير، وقد ضبطناها على عدم تخزينه. تُخزَّن
> البيانات في الاتحاد الأوروبي وتُحفظ مدة لا تتجاوز ٩٠ يوماً.

Check before publishing: the retention period of your Sentry plan, and that Sentry's DPA is accepted
(Sentry > Settings > Legal & Compliance). Storage in the EU is a transfer outside Saudi Arabia, so
have the PDPL transfer wording reviewed.

**2. Cookie banner body** (it names only Google Analytics today)

> **EN:** We use analytics cookies (Google Analytics) to understand how Qaftr is used, and send error
> reports (Sentry) to fix problems. We don’t use them for ads.

> **AR:** نستخدم ملفات تعريف الارتباط التحليلية (Google Analytics) لفهم كيفية استخدام قافتر وتحسينه،
> ونرسل تقارير الأعطال (Sentry) لإصلاحها. لا نستخدمها للإعلانات.

People who accepted the old banner have not agreed to error reports. If that matters, change
`CONSENT_STORAGE_KEY` so the banner asks again.

Also noticed: the privacy policy does not name Google Analytics at all.
