import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { BusinessProfileForm } from './BusinessProfileForm'

const COMPLETE = {
  nameAr: 'مؤسسة قافتر التجارية',
  nameEn: null,
  vatNumber: '300000000000003',
  crNumber: '1010010000',
  street: 'طريق الملك فهد',
  buildingNumber: '1234',
  additionalNumber: null,
  district: 'العليا',
  city: 'الرياض',
  postalCode: '12211',
}

const type = (label: RegExp | string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } })

describe('BusinessProfileForm', () => {
  it('shows what is still missing for ZATCA Phase 2 and updates as fields are filled', () => {
    render(<BusinessProfileForm lang="en" initial={{ nameAr: 'Qaftr', vatNumber: '300000000000003' }} onSave={vi.fn()} />)
    const status = screen.getByTestId('zatca-readiness')
    expect(status.textContent).toMatch(/6 details missing/)
    expect(status.textContent).toMatch(/Commercial registration \(CR\) number: Required/)
    type('Commercial registration (CR) number', '1010010000')
    expect(status.textContent).toMatch(/5 details missing/)
  })

  it('says the profile is complete when every Phase 2 field is valid', () => {
    render(<BusinessProfileForm lang="en" initial={COMPLETE} onSave={vi.fn()} />)
    expect(screen.getByTestId('zatca-readiness').textContent).toMatch(/complete for ZATCA Phase 2/)
  })

  it('accepts Arabic-Indic digits and saves them as Latin digits', async () => {
    const onSave = vi.fn(async (_values: unknown) => undefined)
    render(<BusinessProfileForm lang="ar" initial={{ ...COMPLETE, postalCode: null }} onSave={onSave} />)
    type('الرمز البريدي', '١٢٢١١')
    expect(screen.getByTestId('zatca-readiness').textContent).toMatch(/مكتمل/)
    fireEvent.click(screen.getByRole('button', { name: 'حفظ' }))
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1))
    expect(onSave.mock.calls[0]![0]).toMatchObject({ postalCode: '12211', nameAr: COMPLETE.nameAr })
  })

  it('blocks saving a badly formatted field and points at it', async () => {
    const onSave = vi.fn()
    render(<BusinessProfileForm lang="en" initial={COMPLETE} onSave={onSave} />)
    type('Building number', '12')
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('4 digits', { selector: '[data-slot="field-error"]' })).toBeTruthy()
    expect(screen.getByLabelText('Building number').getAttribute('aria-invalid')).toBe('true')
    expect(onSave).not.toHaveBeenCalled()
  })

  it('requires the Arabic business name', async () => {
    const onSave = vi.fn()
    render(<BusinessProfileForm lang="en" initial={null} onSave={onSave} />)
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('Required', { selector: '[data-slot="field-error"]' })).toBeTruthy()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('shows field errors returned by the server', async () => {
    const onSave = vi.fn(async () => {
      throw new Error('INVALID_PROFILE:crNumber:INVALID_CR')
    })
    render(<BusinessProfileForm lang="en" initial={COMPLETE} onSave={onSave} />)
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('10 digits', { selector: '[data-slot="field-error"]' })).toBeTruthy()
  })

  it('confirms a successful save', async () => {
    render(<BusinessProfileForm lang="en" initial={COMPLETE} onSave={async () => undefined} />)
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByRole('status')).toBeTruthy()
    expect(screen.getByRole('status').textContent).toMatch(/Saved/)
  })
})
