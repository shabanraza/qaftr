import { test as base, expect } from '@playwright/test'
import type { BrowserContext, BrowserContextOptions, Page } from '@playwright/test'

/**
 * Every test gets a `consoleGuard` (auto) that records console errors, page
 * errors and 4xx/5xx responses, and fails the test at teardown if any were seen.
 *
 * Allow expected noise per file/describe with
 *   test.use({ allowedErrors: [/pattern/] })
 * The pattern is matched against the recorded line, e.g.
 *   "console: Failed to load resource ..." or "response 404 GET http://.../nope".
 */
export const GLOBAL_ALLOWED_ERRORS: RegExp[] = [
  // Vite dev-only noise (HMR socket reconnects, devtools).
  /\[vite\]/i,
  /WebSocket connection to .* failed/i,
  // Chrome logs the document's own 4xx as a console error; the response itself
  // is checked separately (and allowlisted per test where expected).
  /Failed to load resource: the server responded with a status of 404/,
  // KNOWN APP ISSUE (reported, not fixed here): the invoice preview iframe is
  // sandboxed without allow-scripts but its srcdoc HTML contains a <script>,
  // so Chrome logs this on the home/fatora pages. Harmless to users.
  /Blocked script execution in 'about:srcdoc'/,
]

type GuardOptions = {
  allowedErrors: RegExp[]
  /** Load web fonts for real (layout specs: text metrics matter). */
  webFonts: boolean
  /**
   * Reuse one browser context per worker (warm HTTP + code cache, ~40% faster
   * page loads); each test still gets a fresh page/tab, so sessionStorage is
   * per test. Opt-in for read-only page sweeps (seo, layout). Leave it off for
   * anything context-wide: page.clock, cookies/auth, permissions, localStorage.
   */
  reuseContext: boolean
}

type GuardFixtures = {
  consoleGuard: { errors: string[] }
}

type WorkerFixtures = {
  /** One reusable context per distinct set of options, per worker. */
  contextPool: Map<string, BrowserContext>
}

export const test = base.extend<GuardOptions & GuardFixtures, WorkerFixtures>({
  allowedErrors: [[], { option: true }],
  webFonts: [false, { option: true }],
  reuseContext: [false, { option: true }],
  contextPool: [
    // eslint-disable-next-line no-empty-pattern -- Playwright requires a destructuring pattern
    async ({}, use) => {
      const pool = new Map<string, BrowserContext>()
      await use(pool)
      await Promise.all([...pool.values()].map((ctx) => ctx.close()))
    },
    { scope: 'worker' },
  ],
  context: async (
    {
      browser,
      contextPool,
      reuseContext,
      baseURL,
      viewport,
      userAgent,
      deviceScaleFactor,
      isMobile,
      hasTouch,
      locale,
      timezoneId,
      colorScheme,
      javaScriptEnabled,
    },
    use,
  ) => {
    // Built from the resolved option fixtures, so test.use() overrides apply.
    const options: BrowserContextOptions = {
      baseURL,
      viewport,
      userAgent,
      deviceScaleFactor,
      isMobile,
      hasTouch,
      locale,
      timezoneId,
      colorScheme,
      javaScriptEnabled,
      acceptDownloads: true,
    }
    if (reuseContext) {
      const key = JSON.stringify(options)
      let ctx = contextPool.get(key)
      if (!ctx) {
        ctx = await browser.newContext(options)
        contextPool.set(key, ctx)
      }
      await use(ctx)
      return
    }
    const ctx = await browser.newContext(options)
    await use(ctx)
    await ctx.close()
  },
  page: async ({ context, webFonts }, use) => {
    const page = await context.newPage()
    // Never send analytics hits from tests; stub them so nothing errors.
    await page.route(/googletagmanager\.com|google-analytics\.com/, (route) =>
      route.fulfill({ status: 200, contentType: 'application/javascript', body: '' }),
    )
    // Web fonts (self-hosted /fonts/*.woff2, plus Google Fonts still used by
    // the invoice preview iframe) only matter for text metrics; skip them
    // unless a test needs them. An empty font is a console warning, not an error.
    if (!webFonts) {
      await page.route(/fonts\.googleapis\.com/, (route) =>
        route.fulfill({ status: 200, contentType: 'text/css', body: '' }),
      )
      await page.route(/\/fonts\/[^/]+\.woff2$/, (route) =>
        route.fulfill({ status: 200, contentType: 'font/woff2', body: '' }),
      )
    }
    await use(page)
    await page.close()
  },
  consoleGuard: [
    async ({ page, allowedErrors }, use, testInfo) => {
      const errors: string[] = []
      const allowed = [...GLOBAL_ALLOWED_ERRORS, ...allowedErrors]
      const record = (line: string) => {
        if (!allowed.some((re) => re.test(line))) errors.push(line)
      }

      page.on('console', (msg) => {
        if (msg.type() === 'error') record(`console: ${msg.text()}`)
      })
      page.on('pageerror', (err) => record(`pageerror: ${err.message}`))
      page.on('response', (res) => {
        const status = res.status()
        if (status >= 400) {
          record(`response ${status} ${res.request().method()} ${res.url()}`)
        }
      })

      await use({ errors })

      if (errors.length && testInfo.status === testInfo.expectedStatus) {
        await testInfo.attach('console-errors', {
          body: errors.join('\n'),
          contentType: 'text/plain',
        })
        expect(errors, 'console errors / page errors / 4xx-5xx responses').toEqual([])
      }
    },
    { auto: true },
  ],
})

export { expect }

/** Arabic-Indic / Persian digits and separators → ASCII, for numeric asserts. */
export function asciiDigits(text: string) {
  return text
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/٬/g, ',')
    .replace(/٫/g, '.')
    .replace(/[\u200e\u200f\u061c\u00a0]/g, '')
}

/** `?lang=en` suffix for a path (or nothing for Arabic). */
export function withLang(path: string, lang: 'ar' | 'en') {
  if (lang === 'ar') return path
  return `${path}${path.includes('?') ? '&' : '?'}lang=en`
}

/**
 * Waits until React has hydrated the page: React attaches `__reactProps$…`
 * to every DOM node it owns, so we look for it on the header's first button.
 * Interacting before this point races SSR markup with no event handlers.
 */
export async function waitForHydration(page: Page) {
  await page.waitForFunction(
    () => {
      const owned = (el: Element | null | undefined) =>
        !!el && Object.keys(el).some((k) => k.startsWith('__reactProps'))
      // Suspense boundaries can hydrate separately, so check the header and
      // the last control in <main> (the tools live there).
      const controls = document.querySelectorAll('main input, main button')
      return (
        owned(document.querySelector('header button, header a')) &&
        (controls.length === 0 || owned(controls[controls.length - 1]))
      )
    },
    undefined,
    { timeout: 20_000 },
  )
}

/** goto with domcontentloaded + hydration (never networkidle: HMR keeps it busy). */
export async function open(page: Page, url: string) {
  const res = await page.goto(url, { waitUntil: 'domcontentloaded' })
  await waitForHydration(page)
  return res
}
