import { existsSync } from 'node:fs'
import os from 'node:os'
import { chromium, devices, webkit, defineConfig } from '@playwright/test'

/**
 * Qaftr e2e suite. See e2e/README.md.
 *
 * - Default: runs against the dev server on :9011 (reused if already running).
 * - E2E_PROD=1 (`bun run e2e:prod`): builds and serves the production worker
 *   with `vite preview` (Cloudflare plugin, workerd) on :9012.
 * - E2E_BASE_URL overrides the target entirely (e.g. a staging deploy).
 */
const prod = process.env.E2E_PROD === '1'
const defaultBase = prod ? 'http://localhost:9012' : 'http://localhost:9011'
const baseURL = process.env.E2E_BASE_URL ?? defaultBase
const port = new URL(baseURL).port || '80'

function installed(path: () => string) {
  try {
    return existsSync(path())
  } catch {
    return false
  }
}

// Prefer Playwright's Chromium; fall back to the system Edge so a fresh clone
// does not need a browser download.
const chromiumBrowser = {
  ...(installed(() => chromium.executablePath()) ? {} : { channel: 'msedge' as const }),
  // Turn off browser background work (Edge especially): ~20% faster page
  // loads when the machine is CPU-bound, which a parallel run always is.
  launchOptions: {
    args: [
      '--disable-gpu',
      '--disable-extensions',
      '--disable-background-networking',
      '--disable-features=Translate,OptimizationHints,MediaRouter,EdgeCollections',
    ],
  },
}
const hasWebkit = installed(() => webkit.executablePath())

const desktop = {
  ...devices['Desktop Chrome'],
  ...chromiumBrowser,
  viewport: { width: 1280, height: 800 },
}

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : Math.max(1, Math.floor(os.cpus().length / 2)),
  timeout: 30_000,
  expect: { timeout: 7_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    // Tracing roughly triples per-test time on Windows; turn it on with --trace=on.
    trace: process.env.CI ? 'on-first-retry' : 'off',
    screenshot: 'only-on-failure',
    // Freeze locale/timezone so number and date formatting are stable.
    locale: 'en-US',
    timezoneId: 'Asia/Dubai',
  },
  // Run cost is dominated by page loads on a CPU-bound machine, so each
  // check runs where it adds signal (see e2e/README.md "What runs where"):
  //  - seo/routing (server HTML, HTTP) and analytics (dataLayer): desktop only.
  //  - layout.spec sweeps every page on desktop at 1280/1024/768 by resizing
  //    one loaded page, and on mobile at 375; tablet/laptop run the other
  //    @layout tests; webkit-mobile runs @smoke (incl. the @smoke pages' layout)
  //    and other @layout tests.
  projects: [
    { name: 'desktop', use: desktop },
    {
      name: 'mobile',
      testIgnore: ['**/seo.spec.ts', '**/routing.spec.ts', '**/analytics.spec.ts'],
      use: {
        ...devices['Pixel 7'],
        ...chromiumBrowser,
        viewport: { width: 375, height: 812 },
      },
    },
    {
      name: 'tablet',
      grep: /@layout/,
      // The page sweep covers 768 from the desktop project.
      testIgnore: ['**/layout.spec.ts'],
      use: { ...desktop, viewport: { width: 768, height: 1024 } },
    },
    // 1024 is where the full desktop nav first appears (lg): the tightest
    // width for the one-row header (nav + region picker + language + auth).
    {
      name: 'laptop',
      grep: /@layout/,
      testIgnore: ['**/layout.spec.ts'],
      use: { ...desktop, viewport: { width: 1024, height: 768 } },
    },
    // Closest stand-in for iPhone Safari, which most SA/UAE visitors use.
    // Skipped (no tests matched) when WebKit is not installed:
    //   npx playwright install webkit
    {
      name: 'webkit-mobile',
      grep: hasWebkit ? /@smoke|@layout/ : /$^/,
      testIgnore: ['**/seo.spec.ts', '**/routing.spec.ts'],
      use: { ...devices['iPhone 13'] },
    },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: prod
          ? `node e2e/prod-server.mjs ${port}`
          : `npx vite dev --port ${port} --strictPort`,
        url: baseURL,
        reuseExistingServer: true,
        timeout: prod ? 300_000 : 120_000,
        stdout: 'ignore',
        stderr: 'pipe',
      },
})
