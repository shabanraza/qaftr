# Qaftr e2e (Playwright)

Fast end-to-end checks for the marketing site and free tools: SEO head, layout
overflow, navigation, routing/static files, the calculators and the invoice PDF.

## Run

From `invoice-app/`:

| Command | What it does |
| --- | --- |
| `bun run e2e:prod` | **Recommended.** Builds the worker, serves it with `vite preview` (workerd) on :9012, runs everything. |
| `bun run e2e` | Runs everything against the dev server on :9011 (reused if already running, else started). |
| `bun run e2e:smoke` | Only `@smoke` tests (add `E2E_PROD=1` / `E2E_BASE_URL` as above). |
| `bun run e2e:ui` | Playwright UI mode: pick tests, watch them run, time-travel through steps. |

Useful flags (append after `--`, e.g. `bun run e2e -- --headed`):

- `--headed` opens real browser windows so you can watch; add `--workers=1` to follow one at a time.
- `--ui` is the same as `e2e:ui`; `--debug` steps through with the inspector.
- `--project=desktop|mobile|tablet|laptop|webkit-mobile`, `-g "readiness"`, `e2e/tools.spec.ts:40`.
- `--trace=on` records traces (off by default: it triples run time on Windows).
- `--repeat-each=3` to hunt flakes.

Environment:

- `E2E_BASE_URL=https://staging.example` targets any server (no web server is started).
- `E2E_PROD=1` = prod build mode on :9012 (what `e2e:prod` sets). `E2E_SKIP_BUILD=1` reuses `dist/`.
- The prod preview needs a `BETTER_AUTH_SECRET`; `e2e/prod-server.mjs` appends a throwaway
  test secret to `dist/server/.dev.vars` (build output only).

The dev server is much slower and less stable under test (unbundled modules per
fresh browser context, dependency re-optimisation reloads, another process editing
files). Prefer `e2e:prod`.

Report: `npx playwright show-report`.

## Browsers / projects

- `desktop` 1280×800: everything. The layout page sweep also resizes each loaded
  page to 1024 and 768 (one load, three widths).
- `mobile` 375×812 (Pixel 7, touch): everything except `seo`, `routing` and
  `analytics` (viewport-independent) and the non-`@smoke` tool cases.
- `tablet` 768×1024 / `laptop` 1024×768: `@layout` tests other than the
  layout.spec page sweep (desktop covers those widths by resizing). Put new
  viewport-sensitive checks under `@layout` and they run here too.
- `webkit-mobile` (iPhone 13, WebKit ≈ iPhone Safari): `@smoke` and `@layout`;
  the layout.spec sweep runs only the `@smoke` pages there (Chromium `mobile`
  sweeps every page at phone width). No `seo`/`routing` (browser-independent).
  Install once with `npx playwright install webkit`; without it the project runs nothing.
- Chromium-based projects use Playwright Chromium if installed, else system Edge (`channel: 'msedge'`).

## Tags

- `@smoke`: fast, critical path (home + /ae SEO and layout, invoice PDF, calculators, AR/EN toggle).
- `@layout`: viewport-sensitive checks (overflow, header row, no "Coming soon").

Put tags in the test (or describe) title: `test('does x @smoke', ...)`.

## Adding things

- **A page**: add one line to `e2e/pages.ts` (`{ path: '/new', region: 'sa' }`). It
  then gets SEO (ar+en), layout (every width) and sitemap-coverage checks
  automatically. `tags: ['@smoke']` also adds it to `e2e:smoke` and WebKit layout.
- **A spec**: create `e2e/<name>.spec.ts` and import `test`, `expect`, `open` from
  `./fixtures` (not from `@playwright/test`) so the console-clean guard applies.
  - Use `open(page, url)`: `domcontentloaded` + waits for React hydration.
    Never use `networkidle`.
  - Prefer `getByRole` / `getByLabel`; read the component for labels.
  - Expected noise: `test.use({ allowedErrors: [/regex/] })`.
  - Read-only page sweeps can `test.use({ reuseContext: true })` (one context per
    worker, fresh tab per test: much faster). Don't use it with `page.clock`,
    cookies or localStorage.
  - Date-dependent UI: `await page.clock.setFixedTime(new Date('2026-11-08T09:00:00+04:00'))` before `open`.
- **A real app bug**: mark the test `test.fixme(...)` with a comment describing it.

## What runs where

| Check | Where | Coverage |
| --- | --- | --- |
| `seo.spec`: server-rendered head, JS **off**, only the HTML document loaded (CSS/fonts/images stubbed) | desktop | every page × lang |
| `layout.spec` hydrated head (`expectSeoHead` after React, console guard on) | desktop | every page × lang |
| `layout.spec` overflow, one-row header, no "Coming soon" | desktop (1280 → 1024 → 768 by resize), mobile (375) | every page × lang × width |
| same, WebKit | webkit-mobile (390) | `@smoke` pages × lang |
| Arabic font-swap CLS < 0.1 | desktop | guide + fatora |

- The machine is CPU-bound during a run (browsers + workerd), so time scales with
  page loads: keep new page sweeps cheap (`reuseContext`, JS off where possible,
  resize instead of reloading per width) and don't repeat browser-independent
  checks in every project.
- Web fonts (self-hosted `/fonts/*.woff2`) are stubbed unless `webFonts: true`.

Timing (8-thread i5 laptop, 4 workers, `bun run e2e:prod` incl. build): see the
latest numbers in the PR/agent report; target is ≤ 6 min.

## Files

- `fixtures.ts`: console/page-error/4xx-5xx guard, analytics + web-font stubbing, helpers.
- `helpers/seo.ts`: `expectSeoHead()`; `helpers/layout.ts`: overflow helpers.
- `pages.ts`: the data-driven page list and canonical/hreflang rules.
