import { test, expect, open, asciiDigits } from './fixtures'

const COPY = {
  ar: {
    url: '/',
    seller: 'الاسم التجاري',
    vat: 'الرقم الضريبي',
    address: 'العنوان',
    client: 'اسم المشتري (اختياري)',
    item: 'بند ١',
    // Arabic-Indic input must be accepted and normalised (١٬٥٠٠٫٠٠ etc.)
    qtyValue: '٢',
    priceValue: '٧٥٠٫٠٠',
    currency: 'ر.س',
    desc: 'الوصف',
    qty: 'الكمية',
    price: 'سعر الوحدة',
    download: 'تنزيل PDF',
  },
  en: {
    url: '/?lang=en',
    seller: 'Trade name',
    vat: 'VAT number',
    address: 'Address',
    client: 'Buyer name (optional)',
    item: 'Item 1',
    qtyValue: '2',
    priceValue: '750',
    currency: 'SAR',
    desc: 'Description',
    qty: 'Qty',
    price: 'Unit price',
    download: 'Download PDF',
  },
} as const

for (const lang of ['ar', 'en'] as const) {
  test(`home invoice tool: totals, QR and PDF download [${lang}] @smoke`, async ({ page }) => {
    const c = COPY[lang]
    await open(page, c.url)
    const tool = page.locator('#invoice-tool')
    // The tool restores its draft from sessionStorage in an effect after mount;
    // typing before that would be overwritten. The preview iframe only renders
    // once those effects have run, so wait for it first.
    await expect(tool.locator('iframe')).toBeVisible({ timeout: 15_000 })

    await tool.getByLabel(c.seller, { exact: true }).fill('Qaftr Design')
    await tool.getByLabel(c.vat, { exact: true }).fill('300000000000003')
    await tool.getByLabel(c.address, { exact: true }).fill('Riyadh')
    await tool.getByLabel(c.client, { exact: true }).fill('Acme Trading')
    await tool.getByLabel(`${c.item}: ${c.desc}`).fill('Logo design')
    await tool.getByLabel(`${c.item}: ${c.qty}`).fill(c.qtyValue)
    await tool.getByLabel(`${c.item}: ${c.price}`).fill(c.priceValue)

    // Totals and QR render inside the sandboxed preview iframe.
    const preview = tool.frameLocator('iframe')
    await expect(preview.locator('img[alt="ZATCA QR"]')).toBeVisible({ timeout: 10_000 })
    await expect
      .poll(async () => asciiDigits(await preview.locator('.totals-table').innerText()))
      .toMatch(/1,500\.00[\s\S]*225\.00[\s\S]*1,725\.00/)
    await expect(preview.locator('.totals-table')).toContainText(c.currency)

    const downloadPromise = page.waitForEvent('download')
    await tool.getByRole('button', { name: c.download }).click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/\.pdf$/i)
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

const STANDARD = {
  ar: {
    url: '/tools/fatora',
    type: /^فاتورة ضريبية(?! مبسطة)/,
    address: 'العنوان',
    buyer: 'اسم المشتري',
    buyerAddress: 'عنوان المشتري',
    buyerVat: 'الرقم الضريبي للمشتري',
    missingVat: 'أدخل الرقم الضريبي للمشتري',
    title: 'فاتورة ضريبية',
    supplyDate: 'تاريخ التوريد (اختياري)',
    supplyLabel: 'تاريخ التوريد',
    vatAmount: 'مبلغ الضريبة',
  },
  en: {
    url: '/tools/fatora?lang=en',
    type: /^Tax invoice/,
    address: 'Address',
    buyer: 'Buyer name',
    buyerAddress: 'Buyer address',
    buyerVat: 'Buyer VAT number',
    missingVat: 'Enter the buyer VAT number',
    title: 'Tax Invoice',
    supplyDate: 'Supply date (optional)',
    supplyLabel: 'Supply date',
    vatAmount: 'VAT amount',
  },
} as const

for (const lang of ['ar', 'en'] as const) {
  test(`standard tax invoice (B2B): buyer VAT required, PDF titled "Tax Invoice" [${lang}] @smoke`, async ({ page }) => {
    const c = { ...COPY[lang], ...STANDARD[lang] }
    await open(page, c.url)
    const tool = page.locator('#invoice-tool')
    await expect(tool.locator('iframe')).toBeVisible({ timeout: 15_000 })

    await tool.getByRole('radio', { name: c.type }).click()
    await expect(tool.getByRole('radio', { name: c.type })).toHaveAttribute('aria-checked', 'true')

    await tool.getByLabel(c.seller, { exact: true }).fill('Qaftr Trading')
    await tool.getByLabel(c.vat, { exact: true }).fill('300000000000003')
    await tool.getByLabel(c.address, { exact: true }).fill('Riyadh, Olaya')
    await tool.getByLabel(c.buyer, { exact: true }).fill('Horizon Co.')
    await tool.getByLabel(c.buyerAddress, { exact: true }).fill('Jeddah, Al Rawdah')
    await tool.getByLabel(`${c.item}: ${c.desc}`).fill('Supply')
    await tool.getByLabel(`${c.item}: ${c.price}`).fill('1000')

    // Missing buyer VAT number blocks the export.
    let downloads = 0
    page.on('download', () => downloads++)
    await tool.getByRole('button', { name: c.download }).click()
    await expect(tool.getByText(c.missingVat, { exact: true }).first()).toBeVisible()
    await expect(tool.getByLabel(c.buyerVat, { exact: true })).toBeFocused()
    expect(downloads).toBe(0)

    await tool.getByLabel(c.buyerVat, { exact: true }).fill('310123456700003')
    await tool.getByLabel(c.supplyDate, { exact: true }).fill('2026-01-15')
    const preview = tool.frameLocator('iframe')
    await expect(preview.locator('.doc-title')).toHaveText(c.title, { timeout: 10_000 })
    // Supply date (differs from today) and per-line VAT, in the same HTML the PDF renders.
    await expect(preview.locator('.supply-date')).toContainText(c.supplyLabel)
    await expect(preview.locator('thead')).toContainText(c.vatAmount)
    await expect.poll(async () => asciiDigits(await preview.locator('td.line-vat').first().innerText())).toBe('150.00')
    await expect.poll(async () => asciiDigits(await preview.locator('td.line-incl').first().innerText())).toBe('1,150.00')

    const downloadPromise = page.waitForEvent('download')
    await tool.getByRole('button', { name: c.download }).click()
    const download = await downloadPromise
    const file = await download.path()
    const { readFileSync } = await import('node:fs')
    const pdf = readFileSync(file).toString('latin1')
    expect(pdf.startsWith('%PDF-')).toBe(true)
    // The PDF body is an image; its metadata title names the type.
    expect(pdf).toMatch(/\/Title \(Tax Invoice INV-\d{3}\)/)
    expect(pdf).not.toContain('Simplified')

    // Sign-up offer appears right after the result.
    await expect(tool.getByRole('region', { name: lang === 'ar' ? 'تم تنزيل الفاتورة' : 'Invoice downloaded' })).toBeVisible()
  })
}

test('mobile: sticky Download PDF bar follows the invoice form', async ({ page }, info) => {
  const bar = page.getByRole('region', { name: 'Invoice actions' })
  await open(page, '/tools/fatora?lang=en')
  const tool = page.locator('#invoice-tool')
  await expect(tool.locator('iframe')).toBeVisible({ timeout: 15_000 })
  if (info.project.name === 'desktop') {
    // Desktop uses the sticky summary column instead.
    await expect(bar).toBeHidden()
    return
  }
  await tool.getByLabel('Item 1: Description').fill('Supply')
  await tool.getByLabel('Item 1: Unit price').fill('100')
  // Back up to the top of the form: the main action card is off screen.
  await tool.getByLabel('Trade name').evaluate((el) => el.scrollIntoView({ block: 'center' }))
  await expect(bar).toBeVisible()
  await expect(bar).toBeInViewport()
  await expect(bar).toContainText('115.00')
  // Reaching the main action card hides the bar (no duplicate buttons).
  await tool.getByRole('button', { name: 'WhatsApp' }).scrollIntoViewIfNeeded()
  await expect(page.getByTestId('mobile-invoice-bar')).toHaveAttribute('data-visible', 'false')
  await expect(bar).toBeHidden()
})

test('switching to a tax invoice keeps focus in the form (first empty buyer field)', async ({ page }) => {
  await open(page, '/tools/fatora?lang=en')
  const tool = page.locator('#invoice-tool')
  await expect(tool.locator('iframe')).toBeVisible({ timeout: 15_000 })
  await tool.getByLabel('Buyer VAT number (optional)', { exact: true }).fill('310123456700003')
  await tool.getByRole('button', { name: 'Switch to a tax invoice' }).click()
  await expect(tool.getByLabel('Buyer name', { exact: true })).toBeFocused()
})

test('mobile: sticky bar stays clickable above the open consent banner', async ({ page }, info) => {
  test.skip(info.project.name === 'desktop', 'mobile bar only')
  await page.addInitScript(() => {
    ;(window as unknown as { __qaftrAnalyticsForce: boolean }).__qaftrAnalyticsForce = true
  })
  await open(page, '/tools/fatora?lang=en')
  const tool = page.locator('#invoice-tool')
  await expect(tool.locator('iframe')).toBeVisible({ timeout: 15_000 })
  const banner = page.getByTestId('consent-banner')
  await expect(banner).toBeVisible()
  await tool.getByLabel('Trade name').evaluate((el) => el.scrollIntoView({ block: 'center' }))
  const bar = page.getByRole('region', { name: 'Invoice actions' })
  await expect(bar).toBeInViewport()
  const [barBox, bannerBox] = [(await bar.boundingBox())!, (await banner.boundingBox())!]
  expect(barBox.y + barBox.height).toBeLessThanOrEqual(bannerBox.y + 1)
  // The bar's Download button is the top element at its own centre.
  const download = bar.getByRole('button', { name: 'Download PDF' })
  expect(
    await download.evaluate((el) => {
      const r = el.getBoundingClientRect()
      return el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2))
    }),
  ).toBe(true)
  await expect(banner.getByRole('button', { name: 'Reject' })).toBeInViewport()
})
