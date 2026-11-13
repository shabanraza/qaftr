// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { prepareBusinessProfile, prepareClientProfile } from './party-input'

describe('prepareBusinessProfile', () => {
  it('normalizes digits and returns only the columns it was given', () => {
    const r = prepareBusinessProfile({ nameAr: ' مؤسسة ', vatNumber: '٣٠٠٠٠٠٠٠٠٠٠٠٠٠٣', crNumber: '1010-010-000', city: 'الرياض' })
    expect(r).toEqual({
      ok: true,
      values: { nameAr: 'مؤسسة', vatNumber: '300000000000003', crNumber: '1010010000', city: 'الرياض' },
    })
  })

  it('clears a field sent as an empty string (stored as null)', () => {
    const r = prepareBusinessProfile({ nameAr: 'X', crNumber: '' })
    expect(r.ok && r.values.crNumber).toBeNull()
  })

  it('rejects badly formatted fields with their issue codes', () => {
    const r = prepareBusinessProfile({ nameAr: 'X', postalCode: '123', crNumber: '99' })
    expect(r).toEqual({
      ok: false,
      issues: [
        { field: 'crNumber', code: 'INVALID_CR' },
        { field: 'postalCode', code: 'INVALID_POSTAL' },
      ],
    })
  })
})

describe('prepareClientProfile', () => {
  it('upper-cases country and ID scheme and keeps a foreign VAT number as typed', () => {
    const r = prepareClientProfile({ name: 'Acme', country: 'ae', vatNumber: '100123456700003', idScheme: 'oth', idValue: 'A1' })
    expect(r).toEqual({
      ok: true,
      values: { name: 'Acme', country: 'AE', vatNumber: '100123456700003', idScheme: 'OTH', idValue: 'A1' },
    })
  })

  it('rejects an invalid Saudi VAT number and an ID scheme without a value', () => {
    const r = prepareClientProfile({ name: 'X', vatNumber: '123', idScheme: 'CRN' })
    expect(r.ok).toBe(false)
    expect(!r.ok && r.issues.map((i) => i.field)).toEqual(['vatNumber', 'idValue'])
  })
})
