import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ClientB2bDetails, ClientB2bBadge } from './ClientB2bDetails'

describe('ClientB2bDetails', () => {
  it('is collapsed by default and reveals the address and ID fields', () => {
    const onChange = vi.fn()
    render(<ClientB2bDetails lang="en" values={{}} onChange={onChange} issues={[]} />)
    expect(screen.queryByLabelText('Building number')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /Saudi address and ID/ }))
    fireEvent.change(screen.getByLabelText('Building number'), { target: { value: '2222' } })
    expect(onChange).toHaveBeenCalledWith('buildingNumber', '2222')
    expect(screen.getByLabelText('ID type')).toBeTruthy()
  })

  it('opens itself when one of its fields has an error', () => {
    render(
      <ClientB2bDetails lang="ar" values={{ postalCode: '1' }} onChange={vi.fn()} issues={[{ field: 'postalCode', code: 'INVALID_POSTAL' }]} />,
    )
    expect(screen.getByLabelText('الرمز البريدي').getAttribute('aria-invalid')).toBe('true')
  })
})

describe('ClientB2bBadge', () => {
  it('says whether a saved client can receive a standard (B2B) tax invoice', () => {
    const { rerender } = render(<ClientB2bBadge lang="en" client={{ name: 'X' }} />)
    expect(screen.getByText('B2B details missing')).toBeTruthy()
    rerender(
      <ClientB2bBadge
        lang="en"
        client={{ name: 'X', vatNumber: '310000000000003', street: 'S', buildingNumber: '2222', district: 'D', city: 'C', postalCode: '12245' }}
      />,
    )
    expect(screen.getByText('Ready for B2B invoices')).toBeTruthy()
  })
})
