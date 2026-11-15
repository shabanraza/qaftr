import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { ZatcaNoteForm } from './ZatcaNoteForm'

const lines = [
  { description: 'Consulting', qty: '2.000', unitPrice: '100.00' },
  { description: 'Travel', qty: '1', unitPrice: '50' },
]

function setup(lang: 'ar' | 'en' = 'en') {
  const onSubmit = vi.fn(async () => undefined)
  const onCancel = vi.fn()
  render(<ZatcaNoteForm lang={lang} originalLines={lines} pending={false} error={null} onSubmit={onSubmit} onCancel={onCancel} />)
  return { onSubmit, onCancel }
}

describe('ZatcaNoteForm', () => {
  it('issues a full credit note by default and needs a reason', async () => {
    const { onSubmit } = setup()
    fireEvent.click(screen.getByRole('button', { name: /Issue credit note/ }))
    expect(await screen.findByText(/Enter a reason/)).toBeTruthy()
    expect(onSubmit).not.toHaveBeenCalled()
    fireEvent.change(screen.getByLabelText(/Reason/), { target: { value: 'Order cancelled' } })
    fireEvent.click(screen.getByRole('button', { name: /Issue credit note/ }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ kind: 'credit-note', reason: 'Order cancelled' }))
  })

  it('credits part of the invoice from its lines, with the note total incl. VAT', async () => {
    const { onSubmit } = setup()
    fireEvent.click(screen.getByLabelText(/Part of the invoice/))
    const rows = screen.getAllByTestId('note-line')
    expect(rows).toHaveLength(2)
    expect(screen.getByTestId('note-total').textContent).toMatch(/287\.50/)
    expect((within(rows[0]!).getByLabelText(/Qty/) as HTMLInputElement).value).toBe('2')
    fireEvent.change(within(rows[0]!).getByLabelText(/Qty/), { target: { value: '1' } })
    fireEvent.click(within(rows[1]!).getByRole('button', { name: /Remove/ }))
    expect(screen.getByTestId('note-total').textContent).toMatch(/115\.00/)
    fireEvent.change(screen.getByLabelText(/Reason/), { target: { value: 'One day refunded' } })
    fireEvent.click(screen.getByRole('button', { name: /Issue credit note/ }))
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        kind: 'credit-note',
        reason: 'One day refunded',
        lines: [{ description: 'Consulting', qty: '1', unitPrice: '100' }],
      }),
    )
  })

  it('issues a debit note from new lines', async () => {
    const { onSubmit } = setup()
    fireEvent.click(screen.getByLabelText(/Debit note/))
    expect(screen.queryByLabelText(/Part of the invoice/)).toBeNull()
    const [row] = screen.getAllByTestId('note-line')
    fireEvent.change(within(row!).getByLabelText(/Description/), { target: { value: 'Extra hour' } })
    fireEvent.change(within(row!).getByLabelText(/Qty/), { target: { value: '1' } })
    fireEvent.change(within(row!).getByLabelText(/Unit price/), { target: { value: '50' } })
    fireEvent.change(screen.getByLabelText(/Reason/), { target: { value: 'Additional work' } })
    fireEvent.click(screen.getByRole('button', { name: /Issue debit note/ }))
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        kind: 'debit-note',
        reason: 'Additional work',
        lines: [{ description: 'Extra hour', qty: '1', unitPrice: '50' }],
      }),
    )
  })

  it('refuses lines without a description or amount', async () => {
    const { onSubmit } = setup()
    fireEvent.click(screen.getByLabelText(/Debit note/))
    fireEvent.change(screen.getByLabelText(/Reason/), { target: { value: 'x' } })
    fireEvent.click(screen.getByRole('button', { name: /Issue debit note/ }))
    expect(await screen.findByText(/Each line needs a description/)).toBeTruthy()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('adds a line and cancels', () => {
    const { onCancel } = setup()
    fireEvent.click(screen.getByLabelText(/Part of the invoice/))
    fireEvent.click(screen.getByRole('button', { name: /Add line/ }))
    expect(screen.getAllByTestId('note-line')).toHaveLength(3)
    fireEvent.click(screen.getByRole('button', { name: /Cancel/ }))
    expect(onCancel).toHaveBeenCalled()
  })

  it('speaks Arabic', () => {
    setup('ar')
    expect(screen.getByLabelText(/إشعار مدين/)).toBeTruthy()
    expect(screen.getByRole('button', { name: /إصدار إشعار دائن/ })).toBeTruthy()
  })
})
