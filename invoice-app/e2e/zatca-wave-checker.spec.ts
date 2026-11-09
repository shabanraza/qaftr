import type { Page } from '@playwright/test'
import { test, expect, open, asciiDigits } from './fixtures'

// /tools/zatca-wave-checker: one test per result path, with the clock frozen
// at 2026-11-08 (Riyadh) so the Wave 25 countdown (1 Feb 2027) is 85 days.
const URL_EN = '/tools/zatca-wave-checker?lang=en'

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-08T09:00:00+03:00'))
})

async function answer(page: Page, question: string, option: string) {
  await page.getByRole('radiogroup', { name: question }).getByText(option, { exact: true }).click()
}

async function check(page: Page, opts: { vat: string; revenues?: Record<number, string> }) {
  await answer(page, '1. Is your business registered for VAT?', opts.vat)
  for (const [year, value] of Object.entries(opts.revenues ?? {})) {
    await page.locator(`#wave-revenue-${year}`).fill(value)
  }
  await page.getByRole('button', { name: 'Check my wave' }).click()
}

const result = (page: Page) => page.getByRole('region', { name: 'Your result' })

test('due: Wave 25 with 85 days left', async ({ page }) => {
  await open(page, URL_EN)
  await check(page, { vat: 'Yes', revenues: { 2024: '200,000' } })
  await expect(result(page).getByRole('heading', { level: 3 })).toHaveText('You are likely in Wave 25')
  await expect(page.getByTestId('wave-days')).toHaveText('85')
  await expect(result(page).getByRole('link', { name: /Wave 25 guide/i })).toHaveAttribute(
    'href',
    /\/guides\/zatca-wave-25/,
  )
})

test('due in Arabic: Arabic-Indic countdown', async ({ page }) => {
  await open(page, '/tools/zatca-wave-checker')
  await answer(page, '١. هل منشأتك مسجّلة في ضريبة القيمة المضافة؟', 'نعم')
  await page.locator('#wave-revenue-2024').fill('200000')
  await page.getByRole('button', { name: 'اعرف موجتك' }).click()
  await expect(page.getByTestId('wave-days')).toHaveText('٨٥')
  expect(asciiDigits(await page.getByTestId('wave-days').innerText())).toBe('85')
})

test('overdue: Wave 24 deadline has passed', async ({ page }) => {
  await open(page, URL_EN)
  await check(page, { vat: 'Yes', revenues: { 2023: '400000' } })
  await expect(result(page).getByRole('heading', { level: 3 })).toHaveText(
    'You are likely in Wave 24 — and the deadline has passed',
  )
})

test('below threshold: not in Waves 23-25', async ({ page }) => {
  await open(page, URL_EN)
  await check(page, { vat: 'Yes', revenues: { 2022: '100000', 2025: '187500' } })
  await expect(result(page).getByRole('heading', { level: 3 })).toHaveText(
    'Based on what you entered, you are not in Waves 23–25',
  )
})

test('not registered for VAT', async ({ page }) => {
  await open(page, URL_EN)
  await check(page, { vat: 'No' })
  await expect(result(page).getByRole('heading', { level: 3 })).toHaveText(
    'Phase 2 integration applies to VAT-registered businesses',
  )
})

test('incomplete: validation errors, no result', async ({ page }) => {
  await open(page, URL_EN)
  await page.getByRole('button', { name: 'Check my wave' }).click()
  await expect(page.getByText('Choose an answer.')).toBeVisible()
  await check(page, { vat: 'Yes' })
  await expect(page.getByText('Enter revenue for at least one year (a positive number).')).toBeVisible()
  await expect(result(page)).toHaveCount(0)
})
