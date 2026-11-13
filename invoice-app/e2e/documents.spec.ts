import { readFileSync } from 'node:fs'
import type { Download, Page } from '@playwright/test'
import { test, expect, open, asciiDigits } from './fixtures'

// Saudi document generators: /tools/receipt-voucher, /tools/quotation,
// /tools/credit-note. Fill each in Arabic and English, check the computed
// values and that the download is a real PDF whose metadata names the type.
const DOWNLOAD = { ar: 'تنزيل PDF', en: 'Download PDF' } as const
const VAT = '300000000000003'
const PREVIEW = { ar: 'معاينة المستند قبل التنزيل', en: 'Document preview before download' } as const

async function downloadPdf(page: Page, lang: 'ar' | 'en'): Promise<{ download: Download; pdf: string }> {
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: DOWNLOAD[lang] }).first().click()
  const download = await downloadPromise
  const pdf = readFileSync(await download.path()).toString('latin1')
  expect(pdf.startsWith('%PDF-')).toBe(true)
  return { download, pdf }
}

const url = (path: string, lang: 'ar' | 'en') => (lang === 'en' ? `${path}?lang=en` : path)

for (const lang of ['ar', 'en'] as const) {
  test.describe(`document generators [${lang}]`, () => {
    // html2canvas + jsPDF is heavy under parallel workers.
    test.setTimeout(60_000)

    test(`receipt voucher: amount in words and PDF [${lang}]`, async ({ page }) => {
      await open(page, url('/tools/receipt-voucher', lang))
      await page.locator('#rv-from').fill(lang === 'ar' ? 'شركة الأفق التجارية' : 'Horizon Trading Co.')
      await page.locator('#rv-amount').fill('1200')
      await page.locator('#rv-purpose').fill(lang === 'ar' ? 'دفعة مقدمة' : 'Advance payment')
      await page.getByText(lang === 'ar' ? 'شيك' : 'Cheque', { exact: true }).click()
      await page.locator('#rv-cheque').fill('000123')
      await page.locator('#rv-bank').fill(lang === 'ar' ? 'مصرف الراجحي' : 'Al Rajhi Bank')

      const words = page.getByTestId('doc-amount-words')
      await expect(words).toContainText('فقط ألف ومئتان ريال سعودي لا غير')
      await expect(words).toContainText('One thousand two hundred Saudi riyals only')
      await expect.poll(async () => asciiDigits(await page.getByTestId('doc-total').innerText())).toContain('1,200.00')

      const preview = page.frameLocator(`iframe[title="${PREVIEW[lang]}"]`)
      await expect(preview.locator('h1')).toContainText(lang === 'ar' ? 'سند قبض' : 'Receipt Voucher')

      const { download, pdf } = await downloadPdf(page, lang)
      expect(download.suggestedFilename()).toBe('qaftr-receipt-voucher-RV-0001.pdf')
      expect(pdf).toMatch(/\/Title \(Receipt Voucher RV-0001\)/)
      await expect(page.getByTestId('doc-save')).toHaveAttribute('data-placement', 'after-result')
    })

    test(`quotation: 15% VAT, PDF and convert to tax invoice [${lang}]`, async ({ page }) => {
      await open(page, url('/tools/quotation', lang))
      await page.locator('#q-seller-name').fill(lang === 'ar' ? 'مؤسسة قافتر التجارية' : 'Qaftr Trading Est.')
      await page.locator('#q-buyer-name').fill(lang === 'ar' ? 'شركة الأفق' : 'Horizon Co.')
      await page.locator('#q-line-0-desc').fill(lang === 'ar' ? 'تصميم شعار' : 'Logo design')
      await page.locator('#q-line-0-qty').fill('2')
      await page.locator('#q-line-0-price').fill('500')
      await expect.poll(async () => asciiDigits(await page.getByTestId('doc-vat').innerText())).toContain('150.00')
      await expect.poll(async () => asciiDigits(await page.getByTestId('doc-total').innerText())).toContain('1,150.00')

      const { download, pdf } = await downloadPdf(page, lang)
      expect(download.suggestedFilename()).toBe('qaftr-quotation-Q-0001.pdf')
      expect(pdf).toMatch(/\/Title \(Quotation Q-0001\)/)

      await page.getByRole('link', { name: lang === 'ar' ? 'حوّل إلى فاتورة ضريبية' : 'Convert to tax invoice' }).click()
      await expect(page).toHaveURL(/\/tools\/fatora/)
      await expect(page.locator('#seller-name')).toHaveValue(
        lang === 'ar' ? 'مؤسسة قافتر التجارية' : 'Qaftr Trading Est.',
      )
    })

    test(`credit note: original invoice reference and PDF titled Credit Note [${lang}]`, async ({ page }) => {
      await open(page, url('/tools/credit-note', lang))
      await page.locator('#cn-orig-number').fill('INV-0042')
      await page.locator('#cn-orig-date').fill('2026-01-15')
      await page.locator('#cn-reason').selectOption('return')
      await page.locator('#cn-seller-name').fill(lang === 'ar' ? 'مؤسسة قافتر التجارية' : 'Qaftr Trading Est.')
      await page.locator('#cn-seller-vat').fill(VAT)
      await page.locator('#cn-buyer-name').fill(lang === 'ar' ? 'شركة الأفق' : 'Horizon Co.')
      await page.locator('#cn-line-0-desc').fill(lang === 'ar' ? 'مرتجع بضاعة' : 'Returned goods')
      await page.locator('#cn-line-0-price').fill('100')
      await expect.poll(async () => asciiDigits(await page.getByTestId('doc-total').innerText())).toContain('115.00')

      const preview = page.frameLocator(`iframe[title="${PREVIEW[lang]}"]`)
      await expect(preview.locator('h1')).toContainText(lang === 'ar' ? 'إشعار دائن' : 'Credit Note')
      await expect(preview.locator('body')).toContainText('INV-0042')

      const { download, pdf } = await downloadPdf(page, lang)
      expect(download.suggestedFilename()).toBe('qaftr-credit-note-CN-0001.pdf')
      expect(pdf).toMatch(/\/Title \(Credit Note CN-0001\)/)
    })
  })
}

test('tools hub links to the three document generators', async ({ page }) => {
  await open(page, '/tools?lang=en')
  for (const href of ['/tools/quotation', '/tools/receipt-voucher', '/tools/credit-note']) {
    await expect(page.locator(`a[href^="${href}"]`).first()).toBeVisible()
  }
})
