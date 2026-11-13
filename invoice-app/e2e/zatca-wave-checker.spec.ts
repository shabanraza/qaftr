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

test('reminder: downloads a parseable .ics and offers Google Calendar + WhatsApp', async ({ page }) => {
  await open(page, URL_EN)
  await check(page, { vat: 'Yes', revenues: { 2024: '200,000' } })
  const reminder = page.getByRole('region', { name: 'Remind me about the deadline' })
  await expect(reminder).toBeVisible()

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    reminder.getByRole('button', { name: 'Add to calendar (.ics)' }).click(),
  ])
  expect(download.suggestedFilename()).toBe('qaftr-zatca-wave-25-deadline.ics')
  const path = await download.path()
  const ics = (await import('node:fs')).readFileSync(path, 'utf-8')
  expect(ics).toMatch(/\r\n$/)
  for (const line of ics.split('\r\n')) expect(Buffer.byteLength(line, 'utf-8')).toBeLessThanOrEqual(75)
  const props = ics
    .replace(/\r\n[ \t]/g, '')
    .split('\r\n')
    .filter(Boolean)
    .map((l) => [l.slice(0, l.indexOf(':')), l.slice(l.indexOf(':') + 1)])
  const get = (k: string) => props.filter(([name]) => name === k).map(([, v]) => v)
  expect(props[0]).toEqual(['BEGIN', 'VCALENDAR'])
  expect(props.at(-1)).toEqual(['END', 'VCALENDAR'])
  expect(get('VERSION')).toEqual(['2.0'])
  expect(get('UID')).toEqual(['zatca-wave-25-2027-02-01@qaftr.com'])
  expect(get('DTSTAMP')[0]).toMatch(/^\d{8}T\d{6}Z$/)
  expect(get('DTSTART;VALUE=DATE')).toEqual(['20270201'])
  expect(get('DTEND;VALUE=DATE')).toEqual(['20270202'])
  expect(get('SUMMARY')).toEqual(['ZATCA Wave 25 integration deadline'])
  expect(get('TRIGGER')).toEqual(['-P30D', '-P7D', '-P1D'])
  expect(get('DESCRIPTION')[0]).toContain('/tools/zatca-wave-checker?lang=en')

  const google = new URL((await reminder.getByRole('link', { name: 'Add to Google Calendar' }).getAttribute('href'))!)
  expect(google.searchParams.get('dates')).toBe('20270201/20270202')
  const wa = new URL((await reminder.getByRole('link', { name: /WhatsApp/ }).getAttribute('href'))!)
  expect(wa.hostname).toBe('wa.me')
  expect(wa.searchParams.get('text')).toContain('85 days left')
})
