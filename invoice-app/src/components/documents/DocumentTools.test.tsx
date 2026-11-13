import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { renderWithRouter } from '#/test/render-with-router'
import { DOCUMENT_DRAFT_KEYS } from '#/lib/documents/draft'

const spies = vi.hoisted(() => ({
  htmlToPdfBlob: vi.fn(async () => new Blob(['%PDF'])),
  downloadBlob: vi.fn(),
  track: vi.fn(),
}))
vi.mock('#/lib/invoice/pdf-render', () => ({
  htmlToPdfBlob: spies.htmlToPdfBlob,
  downloadBlob: spies.downloadBlob,
}))
vi.mock('#/lib/analytics/track', () => ({ track: spies.track }))
vi.mock('#/components/instant-invoice/AuthGateDialog', () => ({
  AuthGateDialog: ({ open }: { open: boolean }) => (open ? <div role="dialog">signup dialog</div> : null),
}))

const { ReceiptVoucherTool } = await import('./ReceiptVoucherTool')
const { QuotationTool } = await import('./QuotationTool')
const { CreditNoteTool } = await import('./CreditNoteTool')

const VAT = '300000000000003'
const type = (el: HTMLElement, value: string) => fireEvent.change(el, { target: { value } })
const field = (label: RegExp, scope: HTMLElement = document.body) =>
  within(scope).getByLabelText<HTMLInputElement>(label, { selector: 'input,textarea,select' })
const downloadButton = () => screen.getAllByRole('button', { name: /Download PDF|تنزيل PDF/ })[0]
const lastHtml = () => (spies.htmlToPdfBlob.mock.calls.at(-1) as unknown as string[])[0]

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  spies.htmlToPdfBlob.mockClear()
  spies.downloadBlob.mockClear()
  spies.track.mockClear()
})

describe('ReceiptVoucherTool', () => {
  it('writes the amount in Arabic words as it is typed', async () => {
    renderWithRouter(<ReceiptVoucherTool lang="ar" />)
    await screen.findByRole('heading', { name: 'بيانات سند القبض' })
    type(field(/^المبلغ \(ريال سعودي\)/), '1200')
    expect(screen.getByTestId('doc-amount-words').textContent).toContain('فقط ألف ومئتان ريال سعودي لا غير')
  })

  it('shows English words in the English UI and cheque fields only for cheques', async () => {
    renderWithRouter(<ReceiptVoucherTool lang="en" />)
    await screen.findByRole('heading', { name: 'Receipt voucher details' })
    type(field(/^Amount \(SAR\)/), '1250.50')
    expect(screen.getByTestId('doc-amount-words').textContent).toContain(
      'One thousand two hundred fifty Saudi riyals and fifty halalas only',
    )
    expect(screen.queryByLabelText(/Cheque no\./)).toBeNull()
    fireEvent.click(screen.getByRole('radio', { name: 'Cheque' }))
    expect(field(/Cheque no\./)).toBeTruthy()
  })

  it('blocks the download and lists issues when fields are missing', async () => {
    renderWithRouter(<ReceiptVoucherTool lang="en" />)
    await screen.findByRole('heading', { name: 'Receipt voucher details' })
    fireEvent.click(downloadButton())
    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toMatch(/Enter who paid the amount/)
    expect(spies.htmlToPdfBlob).not.toHaveBeenCalled()
  })

  it('downloads the PDF, tracks it and keeps the draft', async () => {
    renderWithRouter(<ReceiptVoucherTool lang="en" />)
    await screen.findByRole('heading', { name: 'Receipt voucher details' })
    type(field(/^Received from/), 'Horizon Co.')
    type(field(/^Amount \(SAR\)/), '1200')
    type(field(/^Being payment for/), 'Advance payment')
    fireEvent.click(downloadButton())
    await waitFor(() => expect(spies.downloadBlob).toHaveBeenCalledTimes(1))
    expect(lastHtml()).toContain('Receipt Voucher')
    expect(lastHtml()).toContain('One thousand two hundred Saudi riyals only')
    expect(spies.downloadBlob.mock.calls[0][1]).toBe('qaftr-receipt-voucher-RV-0001.pdf')
    expect(spies.track).toHaveBeenCalledWith('document_pdf_download', {
      tool: 'receipt_voucher',
      output_lang: 'en',
      currency: 'SAR',
      payment_method: 'cash',
    })
    expect((await screen.findByTestId('doc-save')).getAttribute('data-placement')).toBe('after-result')
    expect(localStorage.getItem(DOCUMENT_DRAFT_KEYS['receipt-voucher'])).toContain('Horizon Co.')
  })
})

describe('QuotationTool', () => {
  async function fill() {
    renderWithRouter(<QuotationTool lang="en" />)
    await screen.findByRole('heading', { name: 'Quotation details' })
    type(field(/^Trade name/, screen.getByRole('group', { name: /Seller/ })), 'Qaftr Est.')
    type(field(/^Buyer name/, screen.getByRole('group', { name: /Buyer/ })), 'Horizon Co.')
    const line = screen.getByRole('group', { name: 'Item 1' })
    type(field(/Description/, line), 'Logo design')
    type(field(/Unit price/, line), '1000')
  }

  it('calculates 15% VAT and downloads the quotation', async () => {
    await fill()
    expect(screen.getByTestId('doc-vat').textContent).toBe('150.00 SAR')
    expect(screen.getByTestId('doc-total').textContent).toBe('1,150.00 SAR')
    fireEvent.click(downloadButton())
    await waitFor(() => expect(spies.downloadBlob).toHaveBeenCalledTimes(1))
    expect(lastHtml()).toContain('Quotation')
    expect(spies.downloadBlob.mock.calls[0][1]).toBe('qaftr-quotation-Q-0001.pdf')
    expect(spies.track).toHaveBeenCalledWith('document_pdf_download', {
      tool: 'quotation',
      output_lang: 'en',
      currency: 'SAR',
      line_count: 1,
    })
  })

  it('converts the quotation into a Saudi tax invoice draft', async () => {
    await fill()
    const link = screen.getByRole('link', { name: /Convert to tax invoice/ })
    expect(link.getAttribute('href')).toBe('/tools/fatora?lang=en')
    fireEvent.click(link)
    const stored = JSON.parse(sessionStorage.getItem('qaftr:instant-invoice-draft') ?? '{}')
    expect(stored.sellerName).toBe('Qaftr Est.')
    expect(stored.lineItems[0].description).toBe('Logo design')
  })
})

describe('CreditNoteTool', () => {
  it('requires the original invoice reference and downloads a titled credit note', async () => {
    renderWithRouter(<CreditNoteTool lang="ar" />)
    await screen.findByRole('heading', { name: 'بيانات الإشعار الدائن' })
    expect(screen.getAllByText(/يجب أن يرتبط الإشعار الدائن بالفاتورة الضريبية الأصلية/).length).toBeGreaterThan(0)
    fireEvent.click(downloadButton())
    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toMatch(/أدخل رقم الفاتورة الضريبية الأصلية/)
    expect(alert.textContent).toMatch(/اختر سبب إصدار الإشعار/)

    type(field(/^رقم الفاتورة الأصلية/), 'INV-0042')
    type(field(/^تاريخ الفاتورة الأصلية/), '2000-01-01')
    type(field(/^سبب الإصدار/), 'return')
    const seller = screen.getByRole('group', { name: /البائع/ })
    type(field(/^الاسم التجاري/, seller), 'مؤسسة قافتر')
    type(field(/^الرقم الضريبي/, seller), VAT)
    type(field(/^اسم المشتري/, screen.getByRole('group', { name: /المشتري/ })), 'شركة الأفق')
    const line = screen.getByRole('group', { name: 'البند ١' })
    type(field(/الوصف/, line), 'مرتجع')
    type(field(/سعر الوحدة/, line), '100')
    expect(screen.getByTestId('doc-total').textContent).toBe('١١٥٫٠٠ ر.س')

    fireEvent.click(downloadButton())
    await waitFor(() => expect(spies.downloadBlob).toHaveBeenCalledTimes(1))
    expect(lastHtml()).toContain('إشعار دائن')
    expect(lastHtml()).toContain('INV-0042')
    expect(spies.downloadBlob.mock.calls[0][1]).toBe('qaftr-credit-note-CN-0001.pdf')
    expect(spies.track).toHaveBeenCalledWith('document_pdf_download', {
      tool: 'credit_note',
      output_lang: 'ar',
      currency: 'SAR',
      line_count: 1,
      reason: 'return',
    })
  })
})
