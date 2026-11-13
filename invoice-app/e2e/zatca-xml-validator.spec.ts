import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { test, expect, open, withLang } from './fixtures'

// /tools/zatca-xml-validator: upload the sandbox-accepted simplified invoice
// (compliance CSID, fully verifiable) and a broken copy of it.
const FIXTURE = resolve(process.cwd(), '../packages/shared/src/zatca-phase2/__fixtures__/sandbox-compliance-simplified.xml')
const VALID = readFileSync(FIXTURE)
const BROKEN = Buffer.from(
  VALID.toString('utf-8')
    .replace(/<cac:PartyTaxScheme><cbc:CompanyID>399999999900003<\/cbc:CompanyID>/, '<cac:PartyTaxScheme>')
    .replace('>115.00</cbc:PayableAmount>', '>120.00</cbc:PayableAmount>'),
)

const upload = (page: import('@playwright/test').Page, name: string, buffer: Buffer) =>
  page.locator('input[type="file"]').setInputFiles({ name, mimeType: 'text/xml', buffer })

for (const lang of ['ar', 'en'] as const) {
  test(`zatca xml validator: a real sandbox invoice passes and is verified [${lang}]`, async ({ page }) => {
    await open(page, withLang('/tools/zatca-xml-validator', lang))
    await upload(page, 'invoice.xml', VALID)
    await expect(page.getByTestId('xml-status')).toContainText(lang === 'ar' ? 'لا توجد مشكلات' : 'No issues found')
    await expect(page.getByTestId('xml-type')).toContainText(lang === 'ar' ? 'فاتورة ضريبية مبسطة' : 'Simplified tax invoice')
    await expect(page.getByTestId('xml-signature')).toContainText(lang === 'ar' ? 'التوقيع سليم' : 'Signature checks out')
    await expect(page.getByText('Qaftr Spike Test LLC', { exact: true })).toBeVisible()
  })
}

test('zatca xml validator: a broken invoice lists missing fields, totals and signature failures', async ({ page }) => {
  await open(page, '/tools/zatca-xml-validator?lang=en')
  await upload(page, 'broken.xml', BROKEN)
  await expect(page.getByTestId('xml-status')).toContainText('issues found')
  await expect(page.getByTestId('xml-missing')).toContainText('Seller VAT number')
  await expect(page.getByTestId('xml-totals')).toContainText('Amount due')
  await expect(page.getByTestId('xml-totals')).toContainText('expected 115.00, found 120.00')
  await expect(page.getByTestId('xml-qr')).toContainText('VAT number in the QR does not match the file')
  await expect(page.getByTestId('xml-signature')).toContainText('does not match')
})

test('zatca xml validator: sample and non-XML input', async ({ page }) => {
  await open(page, '/tools/zatca-xml-validator?lang=en')
  await page.getByRole('button', { name: 'Try a sample' }).click()
  await expect(page.getByTestId('xml-status')).toContainText('No issues found')
  await page.getByLabel('Invoice XML', { exact: true }).fill('not xml at all')
  await expect(page.getByRole('alert')).toContainText('not valid XML')
})
