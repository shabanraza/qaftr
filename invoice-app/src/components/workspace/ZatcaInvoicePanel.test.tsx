import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ZatcaInvoicePanel } from './ZatcaInvoicePanel'

const unsigned = { zatcaStatus: 'not_required', icv: null, zatcaSubtype: null, zatcaLastError: null }

describe('ZatcaInvoicePanel', () => {
  it('renders nothing when the business is not connected and the invoice was never sent', () => {
    const { container } = render(<ZatcaInvoicePanel lang="en" invoice={unsigned} connected={false} onIssue={vi.fn()} onRetry={vi.fn()} />)
    expect(container.textContent).toBe('')
  })

  it('sends an unsigned invoice to ZATCA', async () => {
    const onIssue = vi.fn(async () => undefined)
    render(<ZatcaInvoicePanel lang="en" invoice={unsigned} connected onIssue={onIssue} onRetry={vi.fn()} />)
    expect(screen.getByText(/Not sent to ZATCA yet/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Send to ZATCA/ }))
    await waitFor(() => expect(onIssue).toHaveBeenCalled())
  })

  it('shows a cleared standard invoice with its counter and no actions', () => {
    render(
      <ZatcaInvoicePanel lang="en" invoice={{ ...unsigned, zatcaStatus: 'cleared', icv: 7, zatcaSubtype: 'standard' }} connected onIssue={vi.fn()} onRetry={vi.fn()} />,
    )
    expect(screen.getByText(/Cleared by ZATCA/)).toBeTruthy()
    expect(screen.getByText(/Tax invoice \(B2B\)/)).toBeTruthy()
    expect(screen.getByText('7')).toBeTruthy()
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('offers a retry when ZATCA could not be reached', async () => {
    const onRetry = vi.fn(async () => undefined)
    render(
      <ZatcaInvoicePanel
        lang="ar"
        invoice={{ ...unsigned, zatcaStatus: 'signed', icv: 3, zatcaSubtype: 'simplified', zatcaLastError: { codes: [], retryable: true, httpStatus: 0 } }}
        connected
        onIssue={vi.fn()}
        onRetry={onRetry}
      />,
    )
    expect(screen.getByText(/موقّعة وبانتظار الإرسال/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /إعادة الإرسال/ }))
    await waitFor(() => expect(onRetry).toHaveBeenCalled())
  })

  it('lists ZATCA error codes on a rejected invoice', () => {
    render(
      <ZatcaInvoicePanel
        lang="en"
        invoice={{ ...unsigned, zatcaStatus: 'rejected', icv: 4, zatcaSubtype: 'standard', zatcaLastError: { codes: ['BR-KSA-63'], retryable: false, httpStatus: 400 } }}
        connected
        onIssue={vi.fn()}
        onRetry={vi.fn()}
      />,
    )
    expect(screen.getByText(/Rejected by ZATCA/)).toBeTruthy()
    expect(screen.getByText(/BR-KSA-63/)).toBeTruthy()
  })

  it('explains why sending failed', async () => {
    const onIssue = vi.fn(async () => {
      throw new Error('BUYER_NOT_READY')
    })
    render(<ZatcaInvoicePanel lang="en" invoice={unsigned} connected onIssue={onIssue} onRetry={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /Send to ZATCA/ }))
    expect((await screen.findByRole('alert')).textContent).toMatch(/client’s B2B details are incomplete/)
  })
})

describe('ZatcaInvoicePanel credit notes', () => {
  const cleared = { zatcaStatus: 'cleared', icv: 7, zatcaSubtype: 'standard' as const, zatcaLastError: null }

  it('issues a full credit note with a reason', async () => {
    const onCreditNote = vi.fn(async (_reason: string) => undefined)
    render(<ZatcaInvoicePanel lang="en" invoice={cleared} connected onIssue={vi.fn()} onRetry={vi.fn()} onCreditNote={onCreditNote} />)
    fireEvent.click(screen.getByRole('button', { name: /Issue credit note/ }))
    fireEvent.click(screen.getByRole('button', { name: /Credit the full invoice/ }))
    expect(await screen.findByText(/Enter a reason/)).toBeTruthy()
    fireEvent.change(screen.getByLabelText(/Reason/), { target: { value: 'Goods returned' } })
    fireEvent.click(screen.getByRole('button', { name: /Credit the full invoice/ }))
    await waitFor(() => expect(onCreditNote).toHaveBeenCalledWith('Goods returned'))
  })

  it('does not offer a credit note on a note or an unsent invoice', () => {
    const { rerender } = render(<ZatcaInvoicePanel lang="en" invoice={unsigned} connected onIssue={vi.fn()} onRetry={vi.fn()} onCreditNote={vi.fn()} />)
    expect(screen.queryByRole('button', { name: /Issue credit note/ })).toBeNull()
    rerender(<ZatcaInvoicePanel lang="en" invoice={cleared} connected onIssue={vi.fn()} onRetry={vi.fn()} />)
    expect(screen.queryByRole('button', { name: /Issue credit note/ })).toBeNull()
  })

  it('explains when the invoice is already fully credited', async () => {
    const onCreditNote = vi.fn(async () => {
      throw new Error('CREDIT_EXCEEDS_INVOICE')
    })
    render(<ZatcaInvoicePanel lang="ar" invoice={cleared} connected onIssue={vi.fn()} onRetry={vi.fn()} onCreditNote={onCreditNote} />)
    fireEvent.click(screen.getByRole('button', { name: /إصدار إشعار دائن/ }))
    fireEvent.change(screen.getByLabelText(/سبب/), { target: { value: 'مرتجع' } })
    fireEvent.click(screen.getByRole('button', { name: /إشعار دائن بكامل الفاتورة/ }))
    expect((await screen.findByRole('alert')).textContent).toMatch(/تتجاوز/)
  })
})
