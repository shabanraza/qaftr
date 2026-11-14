import { describe, expect, it } from 'vitest'
import { buildClientPayload, clientToForm, emptyClientForm } from './client-form'

const saved = {
  id: 'c1',
  name: 'شركة النور',
  vatNumber: '310000000000001',
  email: 'info@alnoor.sa',
  phone: null,
  country: null,
  idScheme: null,
  idValue: null,
  street: 'King Fahd Road',
  buildingNumber: '1234',
  additionalNumber: null,
  district: null,
  city: 'Riyadh',
  postalCode: null,
}

describe('clientToForm', () => {
  it('turns a saved client into form strings, blanks for missing values', () => {
    const form = clientToForm(saved)
    expect(form).toMatchObject({ name: 'شركة النور', vatNumber: '310000000000001', email: 'info@alnoor.sa', phone: '' })
    expect(form.b2b).toMatchObject({ street: 'King Fahd Road', buildingNumber: '1234', city: 'Riyadh', district: '' })
  })
})

describe('buildClientPayload', () => {
  it('leaves blank fields out when creating', () => {
    const payload = buildClientPayload({ ...emptyClientForm(), name: ' Al Noor ', b2b: { city: 'Riyadh' } }, 'create')
    expect(payload).toEqual({ name: 'Al Noor', city: 'Riyadh' })
  })

  it('clears blank fields when updating, so removed details are really removed', () => {
    const form = clientToForm(saved)
    const payload = buildClientPayload({ ...form, email: '', b2b: { ...form.b2b, street: '' } }, 'update')
    expect(payload).toMatchObject({ name: 'شركة النور', email: null, phone: null, street: null, city: 'Riyadh' })
    expect(payload.vatNumber).toBe('310000000000001')
  })
})
