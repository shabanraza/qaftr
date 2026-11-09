import { test, expect, open } from './fixtures'
import type { Page } from '@playwright/test'

const canonical = (page: Page) => page.locator('head link[rel="canonical"]')

/** Marks the window so we can prove a navigation stayed client-side. */
async function markWindow(page: Page) {
  await page.evaluate(() => {
    ;(window as unknown as { __e2eMarker: boolean }).__e2eMarker = true
  })
}
async function expectSameWindow(page: Page) {
  expect(
    await page.evaluate(() => (window as unknown as { __e2eMarker?: boolean }).__e2eMarker),
    'navigation should be client-side (no full reload)',
  ).toBe(true)
}

test.describe('navigation', () => {
  test('client-side nav Saudi → /ae → back updates html lang and canonical', async ({ page }) => {
    await open(page, '/')
    await markWindow(page)
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar-SA')

    await page.getByRole('contentinfo').getByRole('link', { name: 'الإمارات', exact: true }).click()
    await expect(page).toHaveURL(/\/ae$/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar-AE')
    await expect(canonical(page)).toHaveAttribute('href', 'https://qaftr.com/ae')
    await expect(page.locator('head link[hreflang="en-AE"]')).toHaveAttribute(
      'href',
      'https://qaftr.com/ae?lang=en',
    )
    await expectSameWindow(page)

    await page.goBack()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar-SA')
    await expect(canonical(page)).toHaveAttribute('href', 'https://qaftr.com/')
    await expectSameWindow(page)
  })

  test('AR ⇄ EN toggle switches language, dir and canonical @smoke', async ({ page }) => {
    await open(page, '/tools')
    await markWindow(page)
    const html = page.locator('html')

    await page.getByRole('radio', { name: 'EN' }).click()
    await expect(page).toHaveURL(/\/tools\?lang=en$/)
    await expect(html).toHaveAttribute('lang', 'en')
    await expect(html).toHaveAttribute('dir', 'ltr')
    await expect(canonical(page)).toHaveAttribute('href', 'https://qaftr.com/tools?lang=en')

    await page.getByRole('radio', { name: 'AR' }).click()
    await expect(page).toHaveURL(/\/tools$/)
    await expect(html).toHaveAttribute('lang', 'ar-SA')
    await expect(html).toHaveAttribute('dir', 'rtl')
    await expect(canonical(page)).toHaveAttribute('href', 'https://qaftr.com/tools')
    await expectSameWindow(page)
  })

  test('AR ⇄ EN toggle on a UAE page keeps the UAE locale', async ({ page }) => {
    await open(page, '/ae/tools/vat-calculator')
    await page.getByRole('radio', { name: 'EN' }).click()
    await expect(page).toHaveURL(/\/ae\/tools\/vat-calculator\?lang=en$/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'en-AE')
  })

  test.describe('mobile menu', () => {
    test.skip(({ isMobile }) => !isMobile, 'hamburger only renders below lg')

    /**
     * Opens the menu. Right after a menu navigation, Radix may still be
     * finishing the previous close (body pointer-events lock), and a tap in that
     * window is dropped, so retry until the dialog is actually open.
     */
    async function openMenu(page: Page, name = 'Open menu') {
      const dialog = page.getByRole('dialog')
      await expect(async () => {
        await page.getByRole('button', { name }).click()
        await expect(dialog).toBeVisible({ timeout: 1_000 })
      }).toPass({ timeout: 10_000 })
      return dialog
    }

    test('opens, closes on Escape and returns focus', async ({ page }) => {
      await open(page, '/?lang=en')
      const trigger = page.getByRole('button', { name: 'Open menu' })
      await trigger.click()
      const dialog = page.getByRole('dialog', { name: 'Menu' })
      await expect(dialog).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(dialog).toBeHidden()
      await expect(trigger).toBeFocused()
    })

    test('links navigate and keep the language', async ({ page }) => {
      await open(page, '/?lang=en')
      const dialog = await openMenu(page)
      await dialog.getByRole('link', { name: 'Free tools' }).click()
      await expect(page).toHaveURL(/\/tools\?lang=en$/)
      await expect(dialog).toBeHidden()
      await expect(page.locator('html')).toHaveAttribute('lang', 'en')

      await (await openMenu(page)).getByRole('link', { name: 'UAE', exact: true }).click()
      await expect(page).toHaveURL(/\/ae\?lang=en$/)
      await expect(page.locator('html')).toHaveAttribute('lang', 'en-AE')
    })

    test('Arabic menu links keep Arabic (no ?lang)', async ({ page }) => {
      await open(page, '/tools')
      await (await openMenu(page, 'فتح القائمة')).getByRole('link', { name: 'الدعم' }).click()
      await expect(page).toHaveURL(/\/support$/)
      await expect(page.locator('html')).toHaveAttribute('lang', 'ar-SA')
    })
  })

  for (const hash of ['features', 'pricing'] as const) {
    test(`home #${hash} link scrolls to the section`, async ({ page, isMobile }) => {
      await open(page, '/?lang=en')
      const label = hash === 'features' ? /^features$/i : /^pricing$/i
      if (isMobile) {
        await page.getByRole('button', { name: 'Open menu' }).click()
        await page.getByRole('dialog').getByRole('link', { name: label }).click()
      } else {
        await page
          .getByRole('navigation', { name: 'Main navigation' })
          .getByRole('link', { name: label })
          .click()
      }
      await expect(page).toHaveURL(new RegExp(`#${hash}$`))
      await expect
        .poll(
          () =>
            page.evaluate(
              (id) => Math.round(document.getElementById(id)!.getBoundingClientRect().top),
              hash,
            ),
          { message: `#${hash} should be scrolled to the top of the viewport` },
        )
        .toBeLessThan(150)
      expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(200)
    })
  }
})
