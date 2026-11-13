import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { renderWithRouter } from '#/test/render-with-router'
import { UAE_INVOICE_DRAFT_KEY, createEmptyUaeDraft } from '#/lib/ae/invoice-draft'
import { UaeInvoiceGenerator } from './UaeInvoiceGenerator'

const pdf = vi.hoisted(() => ({
  htmlToPdfBlob: vi.fn(async () => new Blob(['%PDF'])),
  downloadBlob: vi.fn(),
}))
vi.mock('#/lib/invoice/pdf-render', () => pdf)
vi.mock('#/components/instant-invoice/AuthGateDialog', () => ({
  AuthGateDialog: ({ open }: { open: boolean }) =>
    open ? <div role="dialog">signup dialog</div> : null,
}))

async function setup(lang: 'ar' | 'en' = 'en') {
  renderWithRouter(<UaeInvoiceGenerator lang={lang} />)
  await screen.findByRole('heading', { name: /Invoice details|بيانات الفاتورة/ })
  const field = (label: RegExp, scope: HTMLElement = document.body) =>
    within(scope).getByLabelText<HTMLInputElement>(label, { selector: 'input,textarea,select' })
  const type = (el: HTMLElement, value: string) => fireEvent.change(el, { target: { value } })
  return { field, type }
}

function fillValid(field: (l: RegExp, s?: HTMLElement) => HTMLInputElement | HTMLTextAreaElement, type: (el: HTMLElement, v: string) => void) {
  const supplier = screen.getByRole('group', { name: /Supplier/ })
  type(field(/^Name/, supplier), 'Noor Design FZ-LLC')
  type(field(/^Address/, supplier), 'Dubai, UAE')
  type(field(/^TRN/, supplier), '100123456700003')
  const customer = screen.getByRole('group', { name: /^Customer/ })
  type(field(/^Name/, customer), 'Gulf Trading LLC')
  type(field(/^Address/, customer), 'Abu Dhabi, UAE')
  const line = screen.getByRole('group', { name: 'Line 1' })
  type(field(/Description/, line), 'Logo design')
  type(field(/Unit price/, line), '1000')
}

describe('UaeInvoiceGenerator', () => {
  beforeEach(() => {
    localStorage.clear()
    pdf.htmlToPdfBlob.mockClear()
    pdf.downloadBlob.mockClear()
  })

  it('calculates 5% VAT in AED as lines are typed', async () => {
    const { field, type } = await setup()
    const line = screen.getByRole('group', { name: 'Line 1' })
    type(field(/Unit price/, line), '1000')
    expect(screen.getByTestId('ae-inv-total-vat').textContent).toBe('50.00 AED')
    expect(screen.getByTestId('ae-inv-total-payable').textContent).toBe('1,050.00 AED')
  })

  it('lists localised issues and does not export when required fields are missing', async () => {
    await setup()
    fireEvent.click(screen.getAllByRole('button', { name: /Download PDF/ })[0]!)
    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toMatch(/Enter the supplier name/)
    expect(alert.textContent).toMatch(/Add at least one line item/)
    expect(pdf.htmlToPdfBlob).not.toHaveBeenCalled()
  })

  it('exports a PDF without a QR code when the invoice is valid', async () => {
    const { field, type } = await setup()
    fillValid(field, type)
    fireEvent.click(screen.getAllByRole('button', { name: /Download PDF/ })[0]!)
    await waitFor(() => expect(pdf.downloadBlob).toHaveBeenCalledTimes(1))
    const html = (pdf.htmlToPdfBlob.mock.calls as unknown as string[][])[0][0]
    expect(html).toContain('Tax Invoice')
    expect(html).toContain('1,050.00 AED')
    expect(html).not.toMatch(/<img|ZATCA/i)
    expect(pdf.downloadBlob.mock.calls[0][1]).toBe('qaftr-tax-invoice-INV-0001.pdf')
  })

  it('warns, without blocking, when the supply date is after the issue date', async () => {
    const { field, type } = await setup()
    fillValid(field, type)
    type(field(/^Invoice date/), '2026-11-09')
    type(field(/^Date of supply/), '2027-05-01')
    const supply = field(/^Date of supply/)
    const hint = document.getElementById(supply.getAttribute('aria-describedby') ?? '')
    expect(hint?.textContent).toMatch(/after the invoice date/)
    fireEvent.click(screen.getAllByRole('button', { name: /Download PDF/ })[0]!)
    await waitFor(() => expect(pdf.downloadBlob).toHaveBeenCalledTimes(1))
  })

  it('shows no supply-date warning when the dates are in order', async () => {
    const { field, type } = await setup()
    type(field(/^Invoice date/), '2026-11-09')
    type(field(/^Date of supply/), '2026-11-01')
    expect(document.body.textContent).not.toMatch(/after the invoice date/)
  })

  it('blocks a simplified invoice to a registered customer above AED 10,000', async () => {
    const { field, type } = await setup()
    fillValid(field, type)
    fireEvent.click(screen.getByRole('radio', { name: 'Simplified tax invoice' }))
    fireEvent.click(screen.getByRole('checkbox', { name: /VAT-registered/ }))
    const customer = screen.getByRole('group', { name: /^Customer/ })
    type(field(/^TRN/, customer), '100987654300003')
    type(field(/Unit price/, screen.getByRole('group', { name: 'Line 1' })), '20000')
    fireEvent.click(screen.getAllByRole('button', { name: /Download PDF/ })[0]!)
    expect((await screen.findByRole('alert')).textContent).toMatch(/use a full tax invoice/)
    expect(pdf.htmlToPdfBlob).not.toHaveBeenCalled()
  })

  it('uses native radios for invoice type and output language', async () => {
    await setup()
    const radios = screen.getAllByRole<HTMLInputElement>('radio')
    expect(radios.every((r) => r.tagName === 'INPUT' && r.type === 'radio')).toBe(true)
    expect(radios.map((r) => r.name)).toEqual(
      expect.arrayContaining(['ae-invoice-type', 'ae-invoice-output']),
    )
  })

  it('switches the preview to bilingual output', async () => {
    await setup()
    fireEvent.click(screen.getByRole('radio', { name: 'عربي + English' }))
    const frame = screen.getByTitle('Tax invoice preview')
    await waitFor(() => expect(frame.getAttribute('srcdoc')).toContain('فاتورة ضريبية | Tax Invoice'))
  })

  it('restores and saves the draft in localStorage after mount', async () => {
    const draft = createEmptyUaeDraft('2026-11-08', 'en')
    draft.supplier.name = 'Saved Supplier'
    localStorage.setItem(UAE_INVOICE_DRAFT_KEY, JSON.stringify(draft))
    const { field, type } = await setup()
    const supplier = screen.getByRole('group', { name: /Supplier/ })
    await waitFor(() => expect(field(/^Name/, supplier).value).toBe('Saved Supplier'))
    type(field(/^Address/, supplier), 'Sharjah')
    await waitFor(() =>
      expect(localStorage.getItem(UAE_INVOICE_DRAFT_KEY)).toContain('Sharjah'),
    )
  })

  it('explains it is not a Peppol e-invoice and links to the quiz and guide', async () => {
    await setup()
    expect(document.body.textContent).toMatch(/not a Peppol \/ PINT AE e-invoice/)
    const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href'))
    expect(hrefs).toContain('/ae/tools/e-invoicing-readiness?lang=en')
    expect(hrefs).toContain('/ae/guides/uae-e-invoicing-2027?lang=en')
  })

  it('has a mobile action bar with the total and a download button', async () => {
    const { field, type } = await setup()
    fillValid(field, type)
    const bar = screen.getByRole('region', { name: 'Invoice actions' })
    expect(bar.textContent).toContain('1,050.00 AED')
    fireEvent.click(within(bar).getByRole('button', { name: 'Download PDF invoice' }))
    await waitFor(() => expect(pdf.downloadBlob).toHaveBeenCalledTimes(1))
  })

  it('moves the sign-up offer right after the summary once the PDF is downloaded', async () => {
    const { field, type } = await setup()
    expect(screen.getByTestId('ae-inv-save').getAttribute('data-placement')).toBe('bottom')
    fillValid(field, type)
    fireEvent.click(screen.getAllByRole('button', { name: /Download PDF/ })[0]!)
    await waitFor(() =>
      expect(screen.getByTestId('ae-inv-save').getAttribute('data-placement')).toBe('after-result'),
    )
    const summary = screen.getByRole('heading', { name: 'Summary' }).closest('[data-slot="card"]')!
    expect(summary.nextElementSibling).toBe(screen.getByTestId('ae-inv-save'))
  })

  it('shows save as coming soon with a signup button instead of saving', async () => {
    await setup()
    expect(document.body.textContent).toMatch(/Save & manage: coming soon for UAE/)
    fireEvent.click(screen.getByRole('button', { name: 'Create a free account' }))
    expect(screen.getByRole('dialog').textContent).toBe('signup dialog')
  })

  it('renders Arabic by default labels in Arabic', async () => {
    await setup('ar')
    expect(screen.getAllByRole('button', { name: 'نزّل الفاتورة PDF' }).length).toBeGreaterThan(0)
    expect(screen.getByRole('radio', { name: 'فاتورة ضريبية مبسطة' })).toBeTruthy()
  })
})
