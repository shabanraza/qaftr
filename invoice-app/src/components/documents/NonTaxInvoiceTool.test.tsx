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

const { NonTaxInvoiceTool } = await import('./NonTaxInvoiceTool')

const type = (el: HTMLElement, value: string) => fireEvent.change(el, { target: { value } })
const field = (label: RegExp, scope: HTMLElement = document.body) =>
  within(scope).getByLabelText<HTMLInputElement>(label, { selector: 'input,textarea,select' })
const downloadButton = () => screen.getAllByRole('button', { name: /Download PDF|تنزيل PDF/ })[0]
const lastHtml = () => (spies.htmlToPdfBlob.mock.calls.at(-1) as unknown as string[])[0]

beforeEach(() => {
  localStorage.clear()
  spies.htmlToPdfBlob.mockClear()
  spies.downloadBlob.mockClear()
  spies.track.mockClear()
})

describe('NonTaxInvoiceTool', () => {
  it('has no VAT number field and no VAT line, and points registered businesses to the tax invoice', async () => {
    renderWithRouter(<NonTaxInvoiceTool lang="en" />)
    await screen.findByRole('heading', { name: 'Non-tax invoice details' })
    expect(screen.queryByLabelText(/VAT number/)).toBeNull()
    expect(screen.queryByTestId('doc-vat')).toBeNull()
    const link = screen.getAllByRole('link', { name: /tax invoice/i })[0]
    expect(link.getAttribute('href')).toBe('/tools/fatora?lang=en')
  })

  it('blocks the download until the seller and a line are entered', async () => {
    renderWithRouter(<NonTaxInvoiceTool lang="ar" />)
    await screen.findByRole('heading', { name: 'بيانات الفاتورة غير الضريبية' })
    fireEvent.click(downloadButton())
    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toMatch(/أدخل اسم المنشأة/)
    expect(spies.htmlToPdfBlob).not.toHaveBeenCalled()
  })

  it('totals the lines without VAT, downloads the PDF and keeps the draft', async () => {
    renderWithRouter(<NonTaxInvoiceTool lang="ar" />)
    await screen.findByRole('heading', { name: 'بيانات الفاتورة غير الضريبية' })
    const seller = screen.getByRole('group', { name: /منشأتك/ })
    type(field(/^اسم المنشأة/, seller), 'مؤسسة النخبة للصيانة')
    type(field(/^رقم السجل التجاري/, seller), '4030123456')
    const line = screen.getByRole('group', { name: 'البند ١' })
    type(field(/الوصف/, line), 'صيانة مكيف')
    type(field(/الكمية/, line), '2')
    type(field(/سعر الوحدة/, line), '150')
    expect(screen.getByTestId('doc-total').textContent).toBe('٣٠٠٫٠٠ ر.س')

    fireEvent.click(downloadButton())
    await waitFor(() => expect(spies.downloadBlob).toHaveBeenCalledTimes(1))
    expect(lastHtml()).toContain('فاتورة غير ضريبية')
    expect(lastHtml()).not.toContain('الرقم الضريبي')
    expect(spies.downloadBlob.mock.calls[0][1]).toBe('qaftr-non-tax-invoice-INV-0001.pdf')
    expect(spies.track).toHaveBeenCalledWith('document_pdf_download', {
      tool: 'non_tax_invoice',
      output_lang: 'ar',
      currency: 'SAR',
      line_count: 1,
    })
    expect(localStorage.getItem(DOCUMENT_DRAFT_KEYS['non-tax-invoice'])).toContain('مؤسسة النخبة للصيانة')
  })
})
