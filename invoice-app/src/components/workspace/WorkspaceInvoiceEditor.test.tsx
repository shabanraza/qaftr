import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import type { EditorBusiness, EditorClient } from '#/lib/workspace/invoice-editor'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, hash, search, ...rest }: { children: React.ReactNode; to: string; hash?: string; search?: unknown }) => (
    <a href={hash ? `${to}#${hash}` : to} data-search={JSON.stringify(search ?? {})} {...rest}>
      {children}
    </a>
  ),
}))
vi.mock('./InvoicePagePreview', () => ({
  InvoicePagePreview: ({ invoice }: { invoice: { client: { name: string } | null; total: string } }) => (
    <div data-testid="preview">
      {invoice.client?.name} {invoice.total}
    </div>
  ),
}))

const { WorkspaceInvoiceEditor } = await import('./WorkspaceInvoiceEditor')

const business: EditorBusiness = {
  id: 'b1', nameAr: 'مؤسسة قافتر', nameEn: 'Qaftr Est.', vatNumber: '300000000000003', address: null, logoUrl: null,
  crNumber: '1010010000', street: 'King Fahd', buildingNumber: '1234', additionalNumber: '5678', district: 'Olaya', city: 'Riyadh', postalCode: '12345',
}
const b2b: EditorClient = {
  id: 'c1', name: 'Al Noor Co', vatNumber: '310000000000003', email: null, phone: null, country: 'SA', idScheme: null, idValue: null,
  street: 'Tahlia', buildingNumber: '1111', additionalNumber: '2222', district: 'Rawdah', city: 'Jeddah', postalCode: '23456',
}

function setup(overrides: Partial<React.ComponentProps<typeof WorkspaceInvoiceEditor>> = {}) {
  const onSave = vi.fn(async () => undefined)
  render(
    <WorkspaceInvoiceEditor lang="en" business={business} clients={[b2b]} nextSeq={4} zatcaConnected={false} onSave={onSave} {...overrides} />,
  )
  return { onSave }
}

function fillFirstLine() {
  fireEvent.change(screen.getByLabelText('Description 1'), { target: { value: 'Design' } })
  fireEvent.change(screen.getByLabelText('Price 1'), { target: { value: '1000' } })
}

describe('WorkspaceInvoiceEditor', () => {
  it('starts as a cash sale (simplified) with the seller from the business profile', () => {
    setup()
    expect(screen.getByText('Qaftr Est.')).toBeTruthy()
    expect(within(screen.getByTestId('invoice-type')).getByText('Simplified tax invoice')).toBeTruthy()
    expect(screen.queryByText('Trade name')).toBeNull()
  })

  it('switches to a tax invoice when a customer with a VAT number is picked', () => {
    setup()
    fireEvent.change(screen.getByLabelText('Customer'), { target: { value: 'c1' } })
    expect(within(screen.getByTestId('invoice-type')).getByText('Tax invoice')).toBeTruthy()
    expect(screen.getByTestId('preview').textContent).toContain('Al Noor Co')
  })

  it('totals the rows with 15% VAT and feeds the preview', () => {
    setup()
    fillFirstLine()
    expect(within(screen.getAllByTestId('invoice-totals')[0]!).getAllByText(/1,150\.00/).length).toBeGreaterThan(0)
    expect(screen.getByTestId('preview').textContent).toContain('1150.00')
  })

  it('adds a row on Enter in the last price field', () => {
    setup()
    fillFirstLine()
    fireEvent.keyDown(screen.getByLabelText('Price 1'), { key: 'Enter' })
    expect(screen.getByLabelText('Description 2')).toBeTruthy()
  })

  it('asks for an item before saving', async () => {
    const { onSave } = setup()
    fireEvent.click(screen.getAllByRole('button', { name: 'Save invoice' })[0]!)
    expect((await screen.findAllByText('Add at least one item with a price.')).length).toBeGreaterThan(0)
    expect(onSave).not.toHaveBeenCalled()
  })

  it('saves a draft linked to the customer', async () => {
    const { onSave } = setup()
    fireEvent.change(screen.getByLabelText('Customer'), { target: { value: 'c1' } })
    fillFirstLine()
    fireEvent.click(screen.getAllByRole('button', { name: 'Save draft' })[0]!)
    await waitFor(() => expect(onSave).toHaveBeenCalled())
    const [input, opts] = onSave.mock.calls[0] as unknown as [Record<string, unknown>, { sendToZatca: boolean }]
    expect(input).toMatchObject({ businessId: 'b1', clientId: 'c1', status: 'draft', total: '1150.00' })
    expect(opts.sendToZatca).toBe(false)
  })

  it('offers to send to ZATCA when connected', async () => {
    const { onSave } = setup({ zatcaConnected: true })
    fillFirstLine()
    fireEvent.click(screen.getAllByRole('button', { name: 'Save and send to ZATCA' })[0]!)
    await waitFor(() => expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ status: 'unpaid' }), { sendToZatca: true }))
  })

  it('warns when a business customer has no full address', () => {
    setup({ clients: [{ ...b2b, city: null }] })
    fireEvent.change(screen.getByLabelText('Customer'), { target: { value: 'c1' } })
    expect(screen.getByText(/address is incomplete/)).toBeTruthy()
  })

  it('links the incomplete-customer warning to editing that customer, then back here', () => {
    setup({ clients: [{ ...b2b, city: null }] })
    fireEvent.change(screen.getByLabelText('Customer'), { target: { value: 'c1' } })
    const link = screen.getByRole('link', { name: 'Complete customer details' })
    expect(JSON.parse(link.getAttribute('data-search') ?? '{}')).toMatchObject({ edit: 'c1', from: 'new-invoice', lang: 'en' })
  })

  it('preselects the customer passed in, e.g. after editing them', () => {
    setup({ initialClientId: 'c1' })
    expect((screen.getByLabelText('Customer') as HTMLSelectElement).value).toBe('c1')
    expect(screen.getByTestId('invoice-type').textContent).toMatch(/Tax invoice/)
  })

  it('ignores an unknown preselected customer', () => {
    setup({ initialClientId: 'gone' })
    expect((screen.getByLabelText('Customer') as HTMLSelectElement).value).toBe('__cash__')
  })

  it('asks to complete the business profile when there is none', () => {
    setup({ business: null })
    expect(screen.getByText(/Complete your business profile/)).toBeTruthy()
    expect((screen.getAllByRole('button', { name: 'Save invoice' })[0] as HTMLButtonElement).disabled).toBe(true)
  })

  it('shows Arabic labels', () => {
    setup({ lang: 'ar' })
    expect(screen.getByLabelText('العميل')).toBeTruthy()
    expect(within(screen.getByTestId('invoice-type')).getByText('فاتورة ضريبية مبسطة')).toBeTruthy()
  })
})

describe('WorkspaceInvoiceEditor save errors', () => {
  it('explains the free plan limit instead of a generic error', async () => {
    const onSave = vi.fn(async () => {
      throw new Error('FREE_INVOICE_LIMIT')
    })
    render(<WorkspaceInvoiceEditor lang="en" business={business} clients={[]} nextSeq={4} zatcaConnected={false} onSave={onSave} />)
    fireEvent.change(screen.getByLabelText('Description 1'), { target: { value: 'Design' } })
    fireEvent.change(screen.getByLabelText('Price 1'), { target: { value: '1000' } })
    fireEvent.click(screen.getAllByRole('button', { name: 'Save invoice' })[0]!)
    expect((await screen.findAllByText(/free plan limit/)).length).toBeGreaterThan(0)
  })
})
