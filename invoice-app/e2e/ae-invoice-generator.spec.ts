import { test, expect, open } from './fixtures'

// /ae/tools/invoice-generator: fill a valid tax invoice, check the AED totals
// (5% VAT, Latin digits in both languages) and that the download is a real PDF.
const COPY = {
  ar: { url: '/ae/tools/invoice-generator', download: 'نزّل الفاتورة PDF' },
  en: { url: '/ae/tools/invoice-generator?lang=en', download: 'Download PDF invoice' },
} as const

for (const lang of ['ar', 'en'] as const) {
  test(`UAE invoice generator: totals and PDF download [${lang}]`, async ({ page }) => {
    // html2canvas + jsPDF is heavy on the dev server under parallel workers.
    test.setTimeout(60_000)
    const c = COPY[lang]
    await open(page, c.url)

    await page.locator('#ae-inv-supplier-name').fill('Noor Design FZ-LLC')
    await page.locator('#ae-inv-supplier-address').fill('Dubai, UAE')
    await page.locator('#ae-inv-supplier-trn').fill('100123456700003')
    await page.locator('#ae-inv-recipient-name').fill('Gulf Trading LLC')
    await page.locator('#ae-inv-recipient-address').fill('Abu Dhabi, UAE')
    await page.locator('#ae-inv-line-0-desc').fill('Logo design')
    await page.locator('#ae-inv-line-0-qty').fill('2')
    await page.locator('#ae-inv-line-0-price').fill('750')

    await expect(page.getByTestId('ae-inv-total-excl')).toContainText('1,500.00')
    await expect(page.getByTestId('ae-inv-total-vat')).toContainText('75.00')
    await expect(page.getByTestId('ae-inv-total-payable')).toContainText('1,575.00')

    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: c.download }).first().click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/^qaftr-tax-invoice-.+\.pdf$/)
    const stream = await download.createReadStream()
    const head = await new Promise<string>((resolve, reject) => {
      stream.once('readable', () => {
        const chunk = stream.read(5) as Buffer | null
        resolve(chunk ? chunk.toString('latin1') : '')
        stream.destroy()
      })
      stream.once('error', reject)
    })
    expect(head).toBe('%PDF-')
  })
}
