import { test, expect, open } from './fixtures'
import type { Page } from '@playwright/test'

// GA4 + Consent Mode v2. GA only runs on the production host, so these tests
// set `window.__qaftrAnalyticsForce` before load to run the head bootstrap on
// localhost. gtag.js itself is stubbed by fixtures.ts, so nothing is sent:
// we assert on window.dataLayer (each entry is a gtag() arguments object).

const CONSENT_KEY = 'qaftr:analytics-consent'

type Entry = unknown[]

async function dataLayer(page: Page): Promise<Entry[]> {
  return page.evaluate(() =>
    ((window as unknown as { dataLayer?: ArrayLike<unknown>[] }).dataLayer ?? []).map((a) =>
      Array.from(a),
    ),
  )
}

async function events(page: Page, name: string) {
  return (await dataLayer(page))
    .filter((e) => e[0] === 'event' && e[1] === name)
    .map((e) => e[2] as Record<string, unknown>)
}

async function forceAnalytics(page: Page, consent?: 'granted' | 'denied') {
  await page.addInitScript(
    ({ key, consent: seeded }) => {
      ;(window as unknown as { __qaftrAnalyticsForce: boolean }).__qaftrAnalyticsForce = true
      if (seeded && !sessionStorage.getItem('e2e-consent-seeded')) {
        localStorage.setItem(key, seeded)
        sessionStorage.setItem('e2e-consent-seeded', '1')
      }
    },
    { key: CONSENT_KEY, consent },
  )
}

const index = (dl: Entry[], a: string, b?: string) =>
  dl.findIndex((e) => e[0] === a && (b === undefined || e[1] === b))

test.describe('without the force flag (localhost)', () => {
  test('GA is not injected and no banner is shown', async ({ page }) => {
    const gaRequests: string[] = []
    page.on('request', (r) => {
      if (/googletagmanager|google-analytics/.test(r.url())) gaRequests.push(r.url())
    })
    await open(page, '/')
    expect(await page.evaluate(() => (window as unknown as { __qaftrAnalytics?: boolean }).__qaftrAnalytics)).toBeUndefined()
    expect(await dataLayer(page)).toEqual([])
    await expect(page.getByTestId('consent-banner')).toHaveCount(0)
    await expect(page.locator('footer').getByRole('button', { name: /cookie|ملفات تعريف/i })).toHaveCount(0)
    expect(gaRequests).toEqual([])
  })
})

test.describe('consent banner', () => {
  test('denied defaults precede config; Arabic RTL banner; accept is remembered', async ({ page }) => {
    await forceAnalytics(page)
    await open(page, '/')

    const dl = await dataLayer(page)
    expect(dl[0]).toEqual([
      'consent',
      'default',
      {
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        analytics_storage: 'denied',
        wait_for_update: 500,
      },
    ])
    expect(index(dl, 'config')).toBeGreaterThan(0)

    const banner = page.getByTestId('consent-banner')
    await expect(banner).toBeVisible()
    await expect(banner).toHaveAttribute('dir', 'rtl')
    // Fixed overlay: appearing after hydration cannot shift page content.
    expect(await banner.evaluate((el) => getComputedStyle(el).position)).toBe('fixed')
    const accept = banner.getByRole('button', { name: 'قبول' })
    const reject = banner.getByRole('button', { name: 'رفض' })
    expect(await accept.getAttribute('class')).toBe(await reject.getAttribute('class'))

    await accept.click()
    await expect(banner).toHaveCount(0)
    expect(await dataLayer(page)).toContainEqual(['consent', 'update', { analytics_storage: 'granted' }])
    expect(await page.evaluate((k) => localStorage.getItem(k), CONSENT_KEY)).toBe('granted')

    await open(page, '/')
    const dl2 = await dataLayer(page)
    expect(dl2[1]).toEqual(['consent', 'update', { analytics_storage: 'granted' }])
    expect(index(dl2, 'config')).toBeGreaterThan(1)
    await expect(page.getByTestId('consent-banner')).toHaveCount(0)
  })

  test('reject (English) denies and is remembered', async ({ page }) => {
    await forceAnalytics(page)
    await open(page, '/ae?lang=en')
    const banner = page.getByRole('region', { name: 'Cookies' })
    await expect(banner).toHaveAttribute('dir', 'ltr')
    await banner.getByRole('button', { name: 'Reject' }).click()
    await expect(banner).toHaveCount(0)
    expect(await dataLayer(page)).toContainEqual([
      'consent',
      'update',
      { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied' },
    ])
    await open(page, '/ae?lang=en')
    await expect(page.getByTestId('consent-banner')).toHaveCount(0)
    expect(index(await dataLayer(page), 'consent', 'update')).toBe(-1)
  })

  test('footer cookie settings reopens the banner; changing to Reject denies', async ({ page }) => {
    await forceAnalytics(page, 'granted')
    await open(page, '/tools/fatora')
    await expect(page.getByTestId('consent-banner')).toHaveCount(0)

    const settings = page.locator('footer').getByRole('button', { name: 'إعدادات ملفات تعريف الارتباط' })
    await settings.click()
    const banner = page.getByTestId('consent-banner')
    await expect(banner).toBeVisible()
    await expect(banner).toBeFocused()
    await banner.getByRole('button', { name: 'رفض' }).click()
    await expect(banner).toHaveCount(0)
    expect(await dataLayer(page)).toContainEqual([
      'consent',
      'update',
      { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied' },
    ])
    expect(await page.evaluate((k) => localStorage.getItem(k), CONSENT_KEY)).toBe('denied')

    // English label, and the choice can be flipped back.
    await open(page, '/tools/fatora?lang=en')
    await page.locator('footer').getByRole('button', { name: 'Cookie settings' }).click()
    await page.getByTestId('consent-banner').getByRole('button', { name: 'Accept' }).click()
    expect(await page.evaluate((k) => localStorage.getItem(k), CONSENT_KEY)).toBe('granted')
  })

  test('fits a 320px screen without horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 })
    await forceAnalytics(page)
    await open(page, '/')
    const banner = page.getByTestId('consent-banner')
    await expect(banner.getByRole('button', { name: 'قبول' })).toBeInViewport()
    await expect(banner.getByRole('button', { name: 'رفض' })).toBeInViewport()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(0)
  })
})

test.describe('events', () => {
  test('tool_used fires once for a settled VAT result, with region and lang', async ({ page }) => {
    await forceAnalytics(page, 'granted')
    await open(page, '/tools/vat-calculator?lang=en')
    const input = page.locator('#vat-amount')
    await input.pressSequentially('1250', { delay: 50 })
    await expect.poll(() => events(page, 'tool_used'), { timeout: 5_000 }).toHaveLength(1)
    expect((await events(page, 'tool_used'))[0]).toMatchObject({
      tool: 'vat_calculator',
      region: 'sa',
      lang: 'en',
    })
  })

  test('UAE TRN checker never sends the TRN', async ({ page }) => {
    await forceAnalytics(page, 'granted')
    await open(page, '/ae/tools/trn-checker')
    await page.locator('#uae-trn-input').fill('100123456700003')
    await expect.poll(() => events(page, 'tool_used'), { timeout: 5_000 }).toHaveLength(1)
    const [params] = await events(page, 'tool_used')
    expect(params).toMatchObject({ tool: 'uae_trn_checker', region: 'ae', lang: 'ar' })
    expect(JSON.stringify(await dataLayer(page))).not.toContain('100123456700003')
  })

  test('language_switch fires from the header toggle', async ({ page }) => {
    await forceAnalytics(page, 'granted')
    await open(page, '/tools/fatora')
    await page.getByRole('radio', { name: 'EN' }).click()
    await expect(page).toHaveURL(/lang=en/)
    await expect
      .poll(() => events(page, 'language_switch'))
      .toEqual([{ from: 'ar', to: 'en', region: 'sa', lang: 'en' }])
  })

  test('UAE invoice generator: invoice_pdf_download without PII', async ({ page }) => {
    test.setTimeout(60_000)
    await forceAnalytics(page, 'granted')
    await open(page, '/ae/tools/invoice-generator?lang=en')
    await page.locator('#ae-inv-supplier-name').fill('Noor Design FZ-LLC')
    await page.locator('#ae-inv-supplier-address').fill('Dubai, UAE')
    await page.locator('#ae-inv-supplier-trn').fill('100123456700003')
    await page.locator('#ae-inv-recipient-name').fill('Gulf Trading LLC')
    await page.locator('#ae-inv-recipient-address').fill('Abu Dhabi, UAE')
    await page.locator('#ae-inv-line-0-desc').fill('Logo design')
    await page.locator('#ae-inv-line-0-price').fill('750')
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Download PDF invoice' }).first().click()
    await downloadPromise
    await expect.poll(() => events(page, 'invoice_pdf_download')).toHaveLength(1)
    expect((await events(page, 'invoice_pdf_download'))[0]).toEqual({
      tool: 'uae_invoice_generator',
      invoice_type: expect.stringMatching(/^(full|simplified)$/),
      line_count: 1,
      currency: 'AED',
      region: 'ae',
      lang: 'en',
    })
    const all = JSON.stringify(await dataLayer(page))
    for (const pii of ['Noor', 'Gulf', '100123456700003', 'Dubai']) expect(all).not.toContain(pii)
  })

  test('home: primary CTA click and Saudi invoice_pdf_download', async ({ page }) => {
    test.setTimeout(60_000)
    await forceAnalytics(page, 'granted')
    await open(page, '/?lang=en')
    await page.locator('main .qaftr-btn-primary').first().click()
    await expect.poll(() => events(page, 'cta_click')).toContainEqual(
      expect.objectContaining({ cta_location: 'main', region: 'sa', lang: 'en' }),
    )

    const tool = page.locator('#invoice-tool')
    await expect(tool.locator('iframe')).toBeVisible({ timeout: 15_000 })
    await tool.getByLabel('Trade name', { exact: true }).fill('Qaftr Design')
    await tool.getByLabel('VAT number', { exact: true }).fill('300000000000003')
    await tool.getByLabel('Address', { exact: true }).fill('Riyadh')
    await tool.getByLabel('Buyer name (optional)', { exact: true }).fill('Acme Trading')
    await tool.getByLabel('Item 1: Description').fill('Logo design')
    await tool.getByLabel('Item 1: Qty').fill('2')
    await tool.getByLabel('Item 1: Unit price').fill('750')
    const downloadPromise = page.waitForEvent('download')
    await tool.getByRole('button', { name: 'Download PDF' }).click()
    await downloadPromise
    await expect.poll(() => events(page, 'invoice_pdf_download')).toEqual([
      { tool: 'home_instant', invoice_type: 'simplified', line_count: 1, currency: 'SAR', region: 'sa', lang: 'en' },
    ])
    expect(JSON.stringify(await dataLayer(page))).not.toContain('300000000000003')
  })
})
