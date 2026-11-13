import { describe, expect, it } from 'vitest'
import { computeDraftTotals, createEmptyDraft } from '@zatca/shared'
import { buildInvoiceHtml, draftToPdfInvoice, pdfDocumentTitle } from './invoice-pdf'
import type { InvoiceForPdf } from './invoice-pdf'

const base: InvoiceForPdf = {
  seqNumber: 3,
  issueDate: '2026-11-09T10:00:00Z',
  subtotal: '100',
  vatAmount: '15',
  total: '115',
  currency: 'SAR',
  notes: null,
  business: { nameAr: 'مؤسسة', nameEn: null, vatNumber: '300000000000003', address: 'الرياض' },
  client: {
    name: 'شركة الأفق',
    vatNumber: '310123456700003',
    address: 'جدة، حي الروضة',
    email: null,
    phone: null,
  },
  lineItems: [{ description: 'x', qty: '1', unitPrice: '100', lineTotal: '100' }],
}

function docTitle(html: string) {
  return html.match(/<div class="doc-title">([^<]*)<\/div>/)?.[1]
}

describe('Saudi invoice PDF title by invoice type', () => {
  it('prints «فاتورة ضريبية» / "Tax Invoice" for a standard invoice', async () => {
    const ar = await buildInvoiceHtml({ ...base, invoiceType: 'standard' }, 'ar', { includeQr: false })
    const en = await buildInvoiceHtml({ ...base, invoiceType: 'standard' }, 'en', { includeQr: false })
    expect(docTitle(ar)).toBe('فاتورة ضريبية')
    expect(docTitle(en)).toBe('Tax Invoice')
    expect(ar).not.toContain('مبسطة')
    expect(en).not.toContain('Simplified')
  })

  it('prints the simplified title for simplified invoices and when the type is unknown (saved invoices)', async () => {
    const typed = await buildInvoiceHtml({ ...base, invoiceType: 'simplified' }, 'en', { includeQr: false })
    const legacy = await buildInvoiceHtml(base, 'ar', { includeQr: false })
    expect(docTitle(typed)).toBe('Simplified Tax Invoice')
    expect(docTitle(legacy)).toBe('فاتورة ضريبية مبسطة')
  })

  it('shows the buyer address on the invoice', async () => {
    const html = await buildInvoiceHtml({ ...base, invoiceType: 'standard' }, 'ar', { includeQr: false })
    expect(html).toContain('جدة، حي الروضة')
  })

  it('keeps the ZATCA QR on standard invoices (optional in Phase 1, allowed)', async () => {
    const html = await buildInvoiceHtml({ ...base, invoiceType: 'standard' }, 'en')
    expect(html).toContain('alt="ZATCA QR"')
  })

  it('names the PDF document after the type, in English for the metadata', () => {
    expect(pdfDocumentTitle({ ...base, invoiceType: 'standard' })).toBe('Tax Invoice INV-003')
    expect(pdfDocumentTitle(base)).toBe('Simplified Tax Invoice INV-003')
  })
})

describe('draftToPdfInvoice', () => {
  const lines = [{ id: '1', description: 'توريد', qty: '1', unitPrice: '100' }]

  it('carries the invoice type and buyer address', () => {
    const draft = {
      ...createEmptyDraft('standard'),
      sellerName: 'مؤسسة',
      sellerVat: '300000000000003',
      clientName: 'شركة',
      clientAddress: ' جدة ',
      clientVat: '310123456700003',
      lineItems: lines,
    }
    const invoice = draftToPdfInvoice(draft, computeDraftTotals(draft))
    expect(invoice.invoiceType).toBe('standard')
    expect(invoice.client?.address).toBe('جدة')
  })

  it('omits the buyer block on a simplified invoice without buyer details', () => {
    const draft = { ...createEmptyDraft('simplified'), sellerName: 'م', lineItems: lines }
    expect(draftToPdfInvoice(draft, computeDraftTotals(draft)).client).toBeNull()
  })
})

function cssRule(html: string, selector: string) {
  const at = html.indexOf(`${selector} {`)
  return at < 0 ? '' : html.slice(at, html.indexOf('}', at))
}

describe('Arabic invoice typography and currency', () => {
  it('shows «ر.س» in Arabic and SAR in English', async () => {
    const ar = await buildInvoiceHtml(base, 'ar', { includeQr: false })
    const en = await buildInvoiceHtml(base, 'en', { includeQr: false })
    const arBody = ar.slice(ar.indexOf('<body'))
    expect(arBody).toContain('ر.س')
    expect(arBody).not.toContain('SAR')
    expect(en).toContain('SAR')
    expect(en).not.toContain('ر.س')
  })

  it('does not letter-space or uppercase Arabic labels (breaks joined glyphs)', async () => {
    const ar = await buildInvoiceHtml(base, 'ar', { includeQr: false })
    for (const sel of ['.party-label', '.brand-sub']) {
      expect(cssRule(ar, sel)).not.toMatch(/letter-spacing:\s*[1-9]/)
      expect(cssRule(ar, sel)).not.toContain('uppercase')
    }
    const en = await buildInvoiceHtml(base, 'en', { includeQr: false })
    expect(cssRule(en, '.party-label')).toContain('uppercase')
  })
})

describe('supply date and per-line VAT', () => {
  const twoLines: InvoiceForPdf = {
    ...base,
    subtotal: '2081.00',
    vatAmount: '312.15',
    total: '2393.15',
    lineItems: [
      { description: 'a', qty: '2', unitPrice: '1000.50', lineTotal: '2001.00' },
      { description: 'b', qty: '1', unitPrice: '80', lineTotal: '80.00' },
    ],
  }

  it('prints the supply date when it differs from the issue date (both types)', async () => {
    for (const invoiceType of ['standard', 'simplified'] as const) {
      const en = await buildInvoiceHtml({ ...base, invoiceType, supplyDate: '2026-11-01' }, 'en', { includeQr: false })
      expect(en).toContain('Supply date')
      expect(en).toContain('November 1, 2026')
    }
    const ar = await buildInvoiceHtml({ ...base, supplyDate: '2026-11-01' }, 'ar', { includeQr: false })
    expect(ar).toContain('تاريخ التوريد')
  })

  it('omits the supply date when unset or on the issue day', async () => {
    const none = await buildInvoiceHtml(base, 'en', { includeQr: false })
    const same = await buildInvoiceHtml({ ...base, supplyDate: '2026-11-09' }, 'en', { includeQr: false })
    expect(none).not.toContain('Supply date')
    expect(same).not.toContain('Supply date')
  })

  it('tax invoice lines show VAT rate, VAT amount and total incl. VAT', async () => {
    const html = await buildInvoiceHtml({ ...twoLines, invoiceType: 'standard' }, 'en', { includeQr: false })
    expect(html).toContain('VAT rate')
    expect(html).toContain('VAT amount')
    expect(html).toContain('Total incl. VAT')
    const vatCells = [...html.matchAll(/<td class="num line-vat">([^<]*)<\/td>/g)].map((m) => m[1])
    expect(vatCells).toEqual(['300.15', '12.00'])
    const inclCells = [...html.matchAll(/<td class="num bold line-incl">([^<]*)<\/td>/g)].map((m) => m[1])
    expect(inclCells).toEqual(['2,301.15', '92.00'])
    expect(html).toMatch(/<td class="num line-rate">15%<\/td>/)
  })

  it('Arabic tax invoice uses Arabic headers for per-line VAT', async () => {
    const html = await buildInvoiceHtml({ ...twoLines, invoiceType: 'standard' }, 'ar', { includeQr: false })
    expect(html).toContain('نسبة الضريبة')
    expect(html).toContain('مبلغ الضريبة')
    expect(html).toContain('الإجمالي شامل الضريبة')
  })

  it('keeps the simplified layout lean (no per-line VAT columns)', async () => {
    const html = await buildInvoiceHtml({ ...twoLines, invoiceType: 'simplified' }, 'en', { includeQr: false })
    expect(html).not.toContain('line-vat')
    expect(html).not.toContain('VAT rate')
  })

  it('carries the supply date from the draft', () => {
    const draft = { ...createEmptyDraft(), supplyDate: '2026-11-01' }
    const pdf = draftToPdfInvoice(draft, computeDraftTotals(draft), 1, new Date('2026-11-09T10:00:00Z'))
    expect(pdf.supplyDate).toBe('2026-11-01')
    const same = { ...draft, supplyDate: '2026-11-09' }
    expect(draftToPdfInvoice(same, computeDraftTotals(same), 1, new Date('2026-11-09T10:00:00Z')).supplyDate).toBeNull()
  })
})

