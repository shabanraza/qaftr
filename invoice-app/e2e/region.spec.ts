import { test, expect, open } from './fixtures'
import type { Page } from '@playwright/test'
import { SITE_URL } from './pages'

/**
 * Region routing (docs/COMPETITOR_UX_SPEC_2026-11-09.md §1.3): the picker maps
 * to the equivalent page and keeps ?lang; the geo banner suggests, never
 * redirects. `?_geo=XX` fakes the visitor country (honoured on localhost only).
 */

async function regionCookie(page: Page) {
  const cookies = await page.context().cookies()
  return cookies.find((c) => c.name === 'qaftr_region')
}

/** Opens `url` and waits until the visitor-country lookup has answered. */
async function openAndLookup(page: Page, url: string) {
  const lookup = page.waitForResponse((r) => r.url().includes('/_serverFn/'))
  await open(page, url)
  expect((await lookup).status()).toBe(200)
  await page.waitForTimeout(150)
}

const banner = (page: Page) => page.getByRole('region', { name: /Country suggestion|اقتراح الدولة/ })

test.describe('region picker', () => {
  test('header picker goes to the equivalent UAE page and keeps lang', async ({ page, isMobile }) => {
    test.skip(isMobile, 'header picker is hidden below sm; mobile uses the menu')
    await open(page, '/tools/vat-calculator?lang=en')
    await page.getByRole('button', { name: 'Country: Saudi Arabia' }).click()
    await page.getByRole('menuitemradio', { name: /UAE · AED/ }).click()
    await expect(page).toHaveURL(/\/ae\/tools\/vat-calculator\?lang=en$/)
    await expect(page.getByRole('button', { name: 'Country: UAE' })).toBeVisible()
    const cookie = await regionCookie(page)
    expect(cookie?.value).toBe('ae')
    expect(cookie?.sameSite).toBe('Lax')
    expect(cookie?.path).toBe('/')
    expect(cookie!.expires - Date.now() / 1000).toBeGreaterThan(360 * 24 * 3600)
  })

  test('mobile menu picker goes to the equivalent Saudi page (Arabic)', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile menu only')
    await open(page, '/ae/tools/invoice-generator')
    await page.getByRole('button', { name: 'فتح القائمة' }).click()
    const dialog = page.getByRole('dialog', { name: 'القائمة' })
    await dialog.getByRole('navigation', { name: 'الدولة' }).getByRole('link', { name: /السعودية/ }).click()
    await expect(page).toHaveURL(/\/tools\/fatora$/)
    expect((await regionCookie(page))?.value).toBe('sa')
  })

  test('footer links point at equivalent pages (crawlable)', async ({ page }) => {
    await open(page, '/guides/zatca-wave-25?lang=en')
    const nav = page.getByRole('contentinfo').getByRole('navigation', { name: 'Country' })
    await expect(nav.getByRole('link', { name: /UAE · AED/ })).toHaveAttribute(
      'href',
      '/ae/guides/uae-e-invoicing-2027?lang=en',
    )
    await expect(nav.getByRole('link', { name: /Saudi Arabia · SAR/ })).toHaveAttribute(
      'href',
      '/guides/zatca-wave-25?lang=en',
    )
  })

  test('unpaired pages map to the other region home', async ({ page }) => {
    await open(page, '/privacy')
    const nav = page.getByRole('contentinfo').getByRole('navigation', { name: 'الدولة' })
    await expect(nav.getByRole('link', { name: /الإمارات/ })).toHaveAttribute('href', '/ae')
  })
})

test.describe('geo suggestion banner', () => {
  test('shows on a Saudi page for a UAE visitor and hides after "Stay"', async ({ page }) => {
    await open(page, '/tools/fatora?lang=en&_geo=AE')
    const b = banner(page)
    await expect(b).toContainText('Looks like you’re in the UAE')
    await expect(b.getByRole('link', { name: 'Go to UAE page' })).toHaveAttribute(
      'href',
      '/ae/tools/invoice-generator?lang=en',
    )
    // Suggest only: still on the Saudi page.
    await expect(page).toHaveURL(/\/tools\/fatora\?/)
    await b.getByRole('button', { name: 'Stay on Saudi page' }).click()
    await expect(b).toHaveCount(0)
    expect((await regionCookie(page))?.value).toBe('sa')

    // Cookie set: never shown again, even for a UAE visitor.
    await open(page, '/?_geo=AE')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await page.waitForTimeout(800)
    await expect(banner(page)).toHaveCount(0)
  })

  test('"Go" moves to the equivalent UAE page and remembers it', async ({ page }) => {
    await open(page, '/tools/trn-checker?_geo=AE')
    await banner(page).getByRole('link', { name: 'انتقل لصفحة الإمارات' }).click()
    await expect(page).toHaveURL(/\/ae\/tools\/trn-checker$/)
    await expect(banner(page)).toHaveCount(0)
    expect((await regionCookie(page))?.value).toBe('ae')
  })

  for (const width of [320, 375]) {
    test(`compact on a ${width}px phone: message full width, buttons on their own row`, async ({ page }) => {
      await page.setViewportSize({ width, height: 740 })
      await open(page, '/ae?lang=en&_geo=SA')
      const b = banner(page)
      await expect(b).toBeVisible()
      const box = (await b.boundingBox())!
      expect(box.height).toBeLessThanOrEqual(120)
      const message = (await b.locator('p').boundingBox())!
      const go = (await b.getByRole('link', { name: 'Go to Saudi page' }).boundingBox())!
      expect(go.y).toBeGreaterThanOrEqual(message.y + message.height - 1)
      expect(message.width).toBeGreaterThan(width - 60)
    })
  }

  test('mirror: a Saudi visitor on a UAE page', async ({ page }) => {
    await open(page, '/ae?lang=en&_geo=SA')
    await expect(banner(page).getByRole('link', { name: 'Go to Saudi page' })).toHaveAttribute(
      'href',
      '/?lang=en',
    )
  })

  // No geo signal, other GCC, or already in the visitor's own region.
  for (const url of ['/tools/fatora', '/tools/fatora?_geo=KW', '/ae?_geo=AE', '/?_geo=SA']) {
    test(`no banner on ${url}`, async ({ page }) => {
      await openAndLookup(page, url)
      await expect(banner(page)).toHaveCount(0)
    })
  }

  test('never auto-redirects deep URLs or home for a UAE visitor', async ({ page }) => {
    for (const path of ['/', '/tools/vat-calculator', '/guides/zatca-wave-25']) {
      const res = await page.goto(`${path}?_geo=AE`, { waitUntil: 'domcontentloaded' })
      expect(res?.status(), path).toBe(200)
      expect(new URL(page.url()).pathname, path).toBe(path)
    }
  })

  test('banner is not in the server HTML (cache-safe)', async ({ request }) => {
    const res = await request.get('/tools/fatora?_geo=AE')
    expect(res.status()).toBe(200)
    const html = await res.text()
    expect(html).not.toContain('Looks like you’re in the UAE')
    expect(html).not.toContain('يبدو أنك في الإمارات')
  })
})

test.describe('hreflang cluster', () => {
  test('paired pages share the SA + AE cluster on both sides', async ({ page }) => {
    const cluster = {
      'ar-SA': `${SITE_URL}/tools/fatora`,
      'en-SA': `${SITE_URL}/tools/fatora?lang=en`,
      'ar-AE': `${SITE_URL}/ae/tools/invoice-generator`,
      'en-AE': `${SITE_URL}/ae/tools/invoice-generator?lang=en`,
      'x-default': `${SITE_URL}/tools/fatora`,
    }
    for (const path of ['/tools/fatora', '/ae/tools/invoice-generator?lang=en']) {
      await open(page, path)
      const alternates = await page
        .locator('head link[rel="alternate"][hreflang]')
        .evaluateAll((els) =>
          Object.fromEntries(els.map((el) => [el.getAttribute('hreflang'), el.getAttribute('href')])),
        )
      expect(alternates, path).toEqual(cluster)
    }
  })
})
