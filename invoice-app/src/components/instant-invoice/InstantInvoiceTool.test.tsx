import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { renderWithRouter } from '#/test/render-with-router'

vi.mock('#/lib/auth-client', () => ({
  authClient: { useSession: () => ({ data: null }), getSession: vi.fn() },
}))
vi.mock('#/integrations/trpc/react', () => ({
  useTRPC: () => ({ instantInvoice: { save: { mutationOptions: () => ({}) } } }),
}))
vi.mock('@tanstack/react-query', () => ({
  useMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))
vi.mock('#/components/instant-invoice/AuthGateDialog', () => ({
  AuthGateDialog: ({ open }: { open: boolean }) => (open ? <div role="dialog">auth</div> : null),
}))

const downloadInvoicePdf = vi.fn()
vi.mock('#/lib/instant-invoice/invoice-pdf', async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- vi.mock factory
  const actual = await importOriginal<typeof import('#/lib/instant-invoice/invoice-pdf')>()
  return {
    ...actual,
    downloadInvoicePdf: (...args: unknown[]) => downloadInvoicePdf(...args),
  }
})
const track = vi.fn()
vi.mock('#/lib/analytics/track', () => ({ track: (...args: unknown[]) => track(...args) }))

vi.stubGlobal(
  'ResizeObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
)

const { InstantInvoiceTool } = await import('./InstantInvoiceTool')

const TYPE_KEY = 'qaftr:sa-invoice-type'

beforeEach(() => {
  sessionStorage.clear()
  localStorage.clear()
  downloadInvoicePdf.mockReset()
  downloadInvoicePdf.mockResolvedValue(undefined)
  track.mockReset()
})
afterEach(() => {
  sessionStorage.clear()
  localStorage.clear()
})

async function renderEn() {
  renderWithRouter(<InstantInvoiceTool lang="en" />)
  // wait for the post-mount draft restore
  await screen.findByRole('radiogroup', { name: 'Invoice type' })
  await waitFor(() => expect(screen.getByLabelText('Trade name')).toBeTruthy())
}

function type(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
}

function fillSellerAndLine() {
  type('Trade name', 'Qaftr Trading')
  type('VAT number', '300000000000003')
  type('Address', 'Riyadh, Olaya')
  fireEvent.change(screen.getByRole('textbox', { name: 'Item 1: Description' }), {
    target: { value: 'Supply' },
  })
  fireEvent.change(screen.getByRole('textbox', { name: /^Item 1: Unit price/ }), {
    target: { value: '100' },
  })
}

function clickDownload() {
  fireEvent.click(screen.getAllByRole('button', { name: 'Download PDF' })[0])
}

describe('InstantInvoiceTool line items (Saudi)', () => {
  it('labels description, quantity and unit price inputs in English', async () => {
    renderWithRouter(<InstantInvoiceTool lang="en" />)
    expect(await screen.findByRole('textbox', { name: 'Item 1: Description' })).toBeTruthy()
    expect(screen.getByRole('textbox', { name: 'Item 1: Qty' })).toBeTruthy()
    expect(screen.getByRole('textbox', { name: /^Item 1: Unit price/ })).toBeTruthy()
  })

  it('labels them in Arabic', async () => {
    renderWithRouter(<InstantInvoiceTool lang="ar" />)
    expect(await screen.findByRole('textbox', { name: /الوصف/ })).toBeTruthy()
    expect(screen.getByRole('textbox', { name: /الكمية/ })).toBeTruthy()
    expect(screen.getByRole('textbox', { name: /سعر الوحدة/ })).toBeTruthy()
  })
})

describe('invoice type: standard (B2B) vs simplified (B2C)', () => {
  it('offers both ZATCA types, simplified by default, with buyer details optional', async () => {
    await renderEn()
    const group = screen.getByRole('radiogroup', { name: 'Invoice type' })
    const simplified = within(group).getByRole('radio', { name: /Simplified tax invoice/ })
    const standard = within(group).getByRole('radio', { name: /^Tax invoice/ })
    expect(simplified.getAttribute('aria-checked')).toBe('true')
    expect(standard.getAttribute('aria-checked')).toBe('false')
    expect(screen.getByLabelText('Buyer name (optional)')).toBeTruthy()
    expect(screen.queryByLabelText('Buyer address')).toBeNull()
  })

  it('in Arabic uses «فاتورة ضريبية» and «فاتورة ضريبية مبسطة»', async () => {
    renderWithRouter(<InstantInvoiceTool lang="ar" />)
    const group = await screen.findByRole('radiogroup', { name: 'نوع الفاتورة' })
    expect(within(group).getByRole('radio', { name: /^فاتورة ضريبية مبسطة/ })).toBeTruthy()
    expect(within(group).getByRole('radio', { name: /^فاتورة ضريبية(?! مبسطة)/ })).toBeTruthy()
  })

  it('switching to a tax invoice requires buyer address and VAT number and remembers the choice', async () => {
    await renderEn()
    fireEvent.click(screen.getByRole('radio', { name: /^Tax invoice/ }))
    expect(screen.getByRole('radio', { name: /^Tax invoice/ }).getAttribute('aria-checked')).toBe('true')
    expect(screen.getByLabelText('Buyer name')).toBeTruthy()
    expect(screen.getByLabelText('Buyer address')).toBeTruthy()
    expect(screen.getByLabelText('Buyer VAT number')).toBeTruthy()
    expect(screen.getByLabelText('Address')).toBeTruthy()
    expect(localStorage.getItem(TYPE_KEY)).toBe('standard')
  })

  it('starts with the remembered type', async () => {
    localStorage.setItem(TYPE_KEY, 'standard')
    await renderEn()
    await waitFor(() =>
      expect(screen.getByRole('radio', { name: /^Tax invoice/ }).getAttribute('aria-checked')).toBe(
        'true',
      ),
    )
  })

  it('blocks the PDF of a tax invoice without the buyer VAT number', async () => {
    await renderEn()
    fireEvent.click(screen.getByRole('radio', { name: /^Tax invoice/ }))
    fillSellerAndLine()
    type('Address', 'Riyadh')
    type('Buyer name', 'Horizon Co.')
    type('Buyer address', 'Jeddah')
    clickDownload()
    expect(await screen.findAllByText('Enter the buyer VAT number')).not.toHaveLength(0)
    expect(downloadInvoicePdf).not.toHaveBeenCalled()
  })

  it('downloads a tax invoice once the buyer details are complete, then offers sign-up', async () => {
    await renderEn()
    fireEvent.click(screen.getByRole('radio', { name: /^Tax invoice/ }))
    fillSellerAndLine()
    type('Address', 'Riyadh')
    type('Buyer name', 'Horizon Co.')
    type('Buyer address', 'Jeddah')
    type('Buyer VAT number', '310123456700003')
    expect(screen.queryByRole('heading', { name: 'Invoice downloaded' })).toBeNull()
    clickDownload()
    await waitFor(() => expect(downloadInvoicePdf).toHaveBeenCalledTimes(1))
    const [invoice] = downloadInvoicePdf.mock.calls[0] as [{ invoiceType: string; client: { address: string } }]
    expect(invoice.invoiceType).toBe('standard')
    expect(invoice.client.address).toBe('Jeddah')
    expect(track).toHaveBeenCalledWith(
      'invoice_pdf_download',
      expect.objectContaining({ invoice_type: 'full' }),
    )
    const result = await screen.findByRole('region', { name: 'Invoice downloaded' })
    const cta = within(result).getByRole('button', { name: 'Create a free account' })
    fireEvent.click(cta)
    expect(await screen.findByRole('dialog')).toBeTruthy()
    expect(track).toHaveBeenCalledWith('cta_click', {
      cta: 'sign_up_after_download',
      cta_location: 'invoice_result',
    })
  })

  it('downloads a simplified invoice without any buyer details', async () => {
    await renderEn()
    fillSellerAndLine()
    clickDownload()
    await waitFor(() => expect(downloadInvoicePdf).toHaveBeenCalledTimes(1))
    const [invoice] = downloadInvoicePdf.mock.calls[0] as [{ invoiceType: string; client: unknown }]
    expect(invoice.invoiceType).toBe('simplified')
    expect(invoice.client).toBeNull()
    expect(track).toHaveBeenCalledWith(
      'invoice_pdf_download',
      expect.objectContaining({ invoice_type: 'simplified' }),
    )
  })

  it('suggests a tax invoice when a simplified invoice gets a valid buyer VAT number', async () => {
    await renderEn()
    expect(screen.queryByRole('button', { name: 'Switch to a tax invoice' })).toBeNull()
    type('Buyer VAT number (optional)', '310123456700003')
    fireEvent.click(await screen.findByRole('button', { name: 'Switch to a tax invoice' }))
    expect(screen.getByRole('radio', { name: /^Tax invoice/ }).getAttribute('aria-checked')).toBe('true')
    expect(screen.queryByRole('button', { name: 'Switch to a tax invoice' })).toBeNull()
  })

  it('moves focus to the first empty required buyer field after switching (not <body>)', async () => {
    await renderEn()
    type('Buyer VAT number (optional)', '310123456700003')
    fireEvent.click(await screen.findByRole('button', { name: 'Switch to a tax invoice' }))
    await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText('Buyer name')))
  })

  it('skips buyer fields that are already filled', async () => {
    await renderEn()
    type('Buyer name (optional)', 'Horizon Co.')
    type('Buyer VAT number (optional)', '310123456700003')
    fireEvent.click(await screen.findByRole('button', { name: 'Switch to a tax invoice' }))
    await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText('Buyer address')))
  })
})

describe('mobile action bar', () => {
  it('has an invoice actions bar with the total and a Download PDF button', async () => {
    await renderEn()
    fillSellerAndLine()
    const bar = screen.getByRole('region', { name: 'Invoice actions' })
    expect(bar.textContent).toMatch(/115\.00/)
    fireEvent.click(within(bar).getByRole('button', { name: 'Download PDF' }))
    await waitFor(() => expect(downloadInvoicePdf).toHaveBeenCalledTimes(1))
  })

  it('sits above the consent banner (bottom offset follows --qaftr-consent-offset)', async () => {
    await renderEn()
    const bar = screen.getByTestId('mobile-invoice-bar')
    expect(bar.style.bottom).toBe('var(--qaftr-consent-offset, 0px)')
  })
})

describe('complete invoice: seller address and supply date', () => {
  it('requires the seller address on a simplified invoice too, naming and focusing the field', async () => {
    await renderEn()
    fillSellerAndLine()
    type('Address', '')
    clickDownload()
    expect((await screen.findAllByText('Enter the seller address')).length).toBeGreaterThan(0)
    await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText('Address')))
    expect(downloadInvoicePdf).not.toHaveBeenCalled()
  })

  it('has an optional supply date that reaches the PDF', async () => {
    await renderEn()
    fillSellerAndLine()
    type('Supply date (optional)', '2020-01-15')
    clickDownload()
    await waitFor(() => expect(downloadInvoicePdf).toHaveBeenCalledTimes(1))
    const [invoice] = downloadInvoicePdf.mock.calls[0] as [{ supplyDate: string | null }]
    expect(invoice.supplyDate).toBe('2020-01-15')
  })

  it('hints (without blocking) when the supply date is after the issue date', async () => {
    await renderEn()
    fillSellerAndLine()
    type('Supply date (optional)', '2099-01-01')
    expect(screen.getByText('The supply date is after the issue date (today). Check it is correct.')).toBeTruthy()
    clickDownload()
    await waitFor(() => expect(downloadInvoicePdf).toHaveBeenCalledTimes(1))
  })

  it('labels the supply date in Arabic', async () => {
    renderWithRouter(<InstantInvoiceTool lang="ar" />)
    expect(await screen.findByLabelText('تاريخ التوريد (اختياري)')).toBeTruthy()
  })
})

