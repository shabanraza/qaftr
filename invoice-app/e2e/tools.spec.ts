import { test, expect, open, asciiDigits } from './fixtures'
import type { Locator, Page } from '@playwright/test'

// Calculator logic is viewport-independent: the full matrix runs on desktop;
// the mobile projects run only the @smoke cases (touch + small screen).
test.beforeEach(({}, info) => {
  test.skip(info.project.name === 'mobile' && !info.tags.includes('@smoke'), 'desktop only')
})

/** Value cell (<dd>) of the result row whose label (<dt>) is `label`. */
function resultValue(page: Page, label: string): Locator {
  return page.locator('dl > div').filter({ has: page.getByText(label, { exact: true }) }).locator('dd')
}

async function expectMoney(locator: Locator, expected: string) {
  await expect.poll(async () => asciiDigits(await locator.innerText())).toContain(expected)
}

test.describe('Saudi VAT calculator (15%)', () => {
  test.beforeEach(async ({ page }) => {
    await open(page, '/tools/vat-calculator?lang=en')
  })

  test('exclusive: 1000 → 150 → 1150 @smoke', async ({ page }) => {
    await page.getByLabel('Amount (SAR)').fill('1000')
    await expectMoney(resultValue(page, 'Subtotal (excl. VAT)'), '1,000.00')
    await expectMoney(resultValue(page, 'VAT 15%'), '150.00')
    await expectMoney(resultValue(page, 'Total incl. VAT'), '1,150.00')
  })

  test('inclusive: 1150 → 1000 + 150', async ({ page }) => {
    await page.getByRole('radio', { name: 'VAT inclusive' }).click()
    await page.getByLabel('Amount (SAR)').fill('1150')
    await expectMoney(resultValue(page, 'Subtotal (excl. VAT)'), '1,000.00')
    await expectMoney(resultValue(page, 'VAT 15%'), '150.00')
    await expectMoney(resultValue(page, 'Total incl. VAT'), '1,150.00')
  })

  test('over the cap shows a hint instead of results', async ({ page }) => {
    await page.getByLabel('Amount (SAR)').fill('1000000000001')
    await expect(page.getByTestId('vat-too-large')).toContainText('too large')
    await expect(resultValue(page, 'Total incl. VAT')).toHaveCount(0)
  })

  test('Arabic: Arabic-Indic input ١٬٠٠٠٫٥٠, results in ر.س', async ({ page }) => {
    await open(page, '/tools/vat-calculator')
    await page.locator('#vat-amount').fill('١٬٠٠٠٫٥٠')
    const total = resultValue(page, 'الإجمالي شامل الضريبة')
    await expectMoney(total, '1,150.58')
    await expect(total).toContainText('ر.س')
    await expect(page.getByText('ضريبة ١٥٪', { exact: true })).toBeVisible()
  })
})

test.describe('UAE VAT calculator (5%)', () => {
  test('exclusive: 1000 → 50 → 1050 @smoke', async ({ page }) => {
    await open(page, '/ae/tools/vat-calculator?lang=en')
    await page.getByLabel('Amount (AED)').fill('1000')
    await expect(page.getByTestId('vat-subtotal')).toHaveText('1,000.00 AED')
    await expect(page.getByTestId('vat-amount')).toHaveText('50.00 AED')
    await expect(page.getByTestId('vat-total')).toHaveText('1,050.00 AED')
  })

  test('large amount keeps cent precision', async ({ page }) => {
    await open(page, '/ae/tools/vat-calculator?lang=en')
    await page.getByLabel('Amount (AED)').fill('12345678901.23')
    await expect(page.getByTestId('vat-total')).toHaveText('12,962,962,846.29 AED')
  })

  test('inclusive mode', async ({ page }) => {
    await open(page, '/ae/tools/vat-calculator?lang=en')
    await page.getByRole('radio', { name: 'Includes VAT' }).click()
    await page.getByLabel('Amount (AED)').fill('1050')
    await expect(page.getByTestId('vat-subtotal')).toHaveText('1,000.00 AED')
    await expect(page.getByTestId('vat-amount')).toHaveText('50.00 AED')
  })

  test('over the cap shows a hint', async ({ page }) => {
    await open(page, '/ae/tools/vat-calculator?lang=en')
    await page.getByLabel('Amount (AED)').fill('1000000000001')
    await expect(page.getByTestId('vat-too-large')).toBeVisible()
    await expect(page.getByTestId('vat-total')).toHaveCount(0)
  })

  test('Arabic: Arabic-Indic digits are accepted', async ({ page }) => {
    await open(page, '/ae/tools/vat-calculator')
    await page.getByLabel('المبلغ (درهم)').fill('١٠٠٠')
    await expect(page.getByTestId('vat-total')).toHaveText('1,050.00 درهم')
  })
})

test.describe('Saudi VAT-number checker', () => {
  test('300000000000003 is valid', async ({ page }) => {
    await open(page, '/tools/trn-checker?lang=en')
    await page.getByLabel('VAT number', { exact: true }).fill('300000000000003')
    await expect(page.getByText('Valid VAT number format').first()).toBeVisible()
  })

  test('a number not ending in 3 is invalid', async ({ page }) => {
    await open(page, '/tools/trn-checker?lang=en')
    await page.getByLabel('VAT number', { exact: true }).fill('300000000000001')
    await expect(page.getByText('Invalid VAT number format').first()).toBeVisible()
  })
})

test.describe('UAE TRN checker', () => {
  test.beforeEach(async ({ page }) => {
    await open(page, '/ae/tools/trn-checker?lang=en')
  })
  const input = (page: Page) => page.getByLabel('Tax Registration Number (TRN)')
  const status = (page: Page) => page.getByRole('status')
  const rule = (page: Page, name: 'characters' | 'length' | 'prefix') =>
    page.getByTestId(`rule-${name}`)

  test('valid 100… TRN @smoke', async ({ page }) => {
    await input(page).fill('100123456789003')
    await expect(status(page)).toHaveText('Valid format')
    for (const r of ['characters', 'length', 'prefix'] as const) {
      await expect(rule(page, r)).toHaveAttribute('data-ok', 'true')
    }
  })

  test('Arabic-Indic digits are normalised', async ({ page }) => {
    await input(page).fill('١٠٠١٢٣٤٥٦٧٨٩٠٠٣')
    await expect(status(page)).toHaveText('Valid format')
    await expect(page.getByTestId('trn-normalized')).toHaveText('100123456789003')
  })

  test('200 prefix is flagged', async ({ page }) => {
    await input(page).fill('200123456789003')
    await expect(status(page)).toHaveText('Invalid format')
    await expect(rule(page, 'prefix')).toHaveAttribute('data-ok', 'false')
    await expect(rule(page, 'length')).toHaveAttribute('data-ok', 'true')
  })

  test('letters are flagged', async ({ page }) => {
    await input(page).fill('100ABC456789003')
    await expect(status(page)).toHaveText('Invalid format')
    await expect(rule(page, 'characters')).toHaveAttribute('data-ok', 'false')
  })

  test('over-long input is flagged, not truncated', async ({ page }) => {
    const long = '1001234567890031234'
    await input(page).fill(long)
    await expect(input(page)).toHaveValue(long)
    await expect(status(page)).toHaveText('Invalid format')
    await expect(rule(page, 'length')).toHaveAttribute('data-ok', 'false')
    await expect(page.getByTestId('trn-normalized')).toHaveText(long)
  })
})

test.describe('UAE e-invoicing readiness quiz', () => {
  // Days-remaining depends on "today": freeze it.
  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-11-08T09:00:00+04:00'))
    await open(page, '/ae/tools/e-invoicing-readiness?lang=en')
  })

  const radio = (page: Page, name: string) => page.getByRole('radio', { name, exact: true })
  // The inputs are visually hidden (sr-only) inside a styled <label>; users
  // click the label, so do the same.
  const choose = async (page: Page, name: string) => {
    await page.locator('label').filter({ has: radio(page, name) }).click()
    await expect(radio(page, name)).toBeChecked()
  }
  const submit = (page: Page) => page.getByRole('button', { name: 'Show my deadline' }).click()

  test('large business (≥ AED 50m) → 54 days @smoke', async ({ page }) => {
    await choose(page, 'No')
    await choose(page, 'Businesses or government (B2B / B2G)')
    await page.getByLabel(/Approximate annual revenue/).fill('60000000')
    await submit(page)
    await expect(page.getByTestId('readiness-status')).toHaveText('Upcoming')
    await expect(page.getByTestId('readiness-days')).toHaveText('54')
  })

  test('small business → 235 days', async ({ page }) => {
    await choose(page, 'No')
    await choose(page, 'Both businesses and consumers')
    await page.getByLabel(/Approximate annual revenue/).fill('1000000')
    await submit(page)
    await expect(page.getByTestId('readiness-days')).toHaveText('235')
  })

  test('government entity → 327 days, no customer/revenue questions', async ({ page }) => {
    await choose(page, 'Yes')
    await expect(page.getByRole('group', { name: /Who do you sell to/ })).toHaveCount(0)
    await expect(page.getByLabel(/Approximate annual revenue/)).toHaveCount(0)
    await submit(page)
    await expect(page.getByTestId('readiness-days')).toHaveText('327')
  })

  test('B2C only → revenue hidden, not in scope', async ({ page }) => {
    await choose(page, 'No')
    await choose(page, 'Consumers only (B2C)')
    await expect(page.getByLabel(/Approximate annual revenue/)).toHaveCount(0)
    await submit(page)
    await expect(page.getByTestId('readiness-status')).toHaveText('Not in scope yet')
    await expect(page.getByTestId('readiness-days')).toHaveCount(0)
  })

  test('radios work with keyboard arrows', async ({ page }) => {
    await radio(page, 'Yes').focus()
    await page.keyboard.press('Space')
    await expect(radio(page, 'Yes')).toBeChecked()
    await page.keyboard.press('ArrowDown')
    await expect(radio(page, 'No')).toBeChecked()
    await expect(radio(page, 'No')).toBeFocused()

    // The customers group appears once "No" is chosen.
    await radio(page, 'Businesses or government (B2B / B2G)').focus()
    await page.keyboard.press('Space')
    await page.keyboard.press('ArrowDown')
    await expect(radio(page, 'Both businesses and consumers')).toBeChecked()
    await page.keyboard.press('ArrowDown')
    await expect(radio(page, 'Consumers only (B2C)')).toBeChecked()
    await expect(page.getByLabel(/Approximate annual revenue/)).toHaveCount(0)
  })

  test('submitting empty shows validation errors', async ({ page }) => {
    await submit(page)
    await expect(page.getByTestId('gov-error')).toBeVisible()
    await expect(page.getByTestId('readiness-result')).toHaveCount(0)
  })
})
