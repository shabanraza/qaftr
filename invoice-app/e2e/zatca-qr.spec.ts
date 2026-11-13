import QRCode from 'qrcode'
import { encodeZatcaQr } from '@zatca/shared'
import { test, expect, open, withLang } from './fixtures'

// /tools/zatca-qr: paste a payload and upload a real QR image (BarcodeDetector
// or the lazily loaded jsQR fallback), in Arabic and English.
const PAYLOAD = encodeZatcaQr({
  sellerName: 'Horizon Trading Co.',
  vatNumber: '300000000000003',
  timestamp: '2026-11-13T10:30:00Z',
  invoiceTotal: '1150.00',
  vatTotal: '150.00',
})

for (const lang of ['ar', 'en'] as const) {
  test(`zatca qr: paste and image upload decode the invoice fields [${lang}]`, async ({ page }) => {
    await open(page, withLang('/tools/zatca-qr', lang))
    await page.getByLabel(lang === 'ar' ? 'نص رمز QR' : 'QR text', { exact: true }).fill(PAYLOAD)
    await expect(page.getByText('Horizon Trading Co.')).toBeVisible()
    await expect(page.getByTestId('qr-phase')).toHaveText(lang === 'ar' ? 'المرحلة الأولى' : 'Phase 1')

    await page.getByRole('button', { name: lang === 'ar' ? 'مسح' : 'Clear' }).click()
    await expect(page.getByText('Horizon Trading Co.')).toHaveCount(0)

    const png = await QRCode.toBuffer(PAYLOAD, { width: 400, margin: 4 })
    await page.locator('input[type="file"]').setInputFiles({ name: 'invoice-qr.png', mimeType: 'image/png', buffer: png })
    await expect(page.getByText('Horizon Trading Co.')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByTestId('qr-status')).toContainText(lang === 'ar' ? 'لا توجد مشكلات' : 'No format issues')
  })
}

test('zatca qr: a non-ZATCA QR image is explained, not crashed on', async ({ page }) => {
  await open(page, '/tools/zatca-qr?lang=en')
  const png = await QRCode.toBuffer('https://example.com/menu', { width: 300 })
  await page.locator('input[type="file"]').setInputFiles({ name: 'menu.png', mimeType: 'image/png', buffer: png })
  await expect(page.getByRole('alert')).toContainText('This is a link')
})
