import { describe, expect, it } from 'vitest'
import { buildZatcaStatus } from './status'

const business = {
  nameAr: 'شركة الاختبار',
  vatNumber: '300000000000003',
  crNumber: '1010010000',
  street: 'King Fahd Rd',
  buildingNumber: '1234',
  district: 'Olaya',
  city: 'Riyadh',
  postalCode: '12345',
}

const unit = {
  id: 'egs_1',
  status: 'active' as const,
  commonName: 'EGS1',
  egsSerial: '1-Qaftr|2-1|3-abc',
  certNotAfter: new Date('2027-01-01'),
  createdAt: new Date('2026-11-01'),
}

describe('buildZatcaStatus', () => {
  it('reports no business and no unit', () => {
    const s = buildZatcaStatus({ env: 'sandbox', business: undefined, entitlement: undefined, unit: undefined })
    expect(s).toMatchObject({ env: 'sandbox', gate: null, hasBusiness: false, sellerReady: false, unit: null })
    expect(s.sandboxOtp).toBeTruthy()
  })

  it('gates simulation without an active pro plan and hides the sandbox OTP', () => {
    const s = buildZatcaStatus({ env: 'simulation', business, entitlement: undefined, unit: undefined })
    expect(s.gate).toBe('ZATCA_PRO_REQUIRED')
    expect(s.sandboxOtp).toBeNull()
  })

  it('returns the active unit and seller readiness', () => {
    const s = buildZatcaStatus({ env: 'sandbox', business, entitlement: { plan: 'pro', status: 'active' }, unit })
    expect(s.hasBusiness).toBe(true)
    expect(s.unit).toEqual(unit)
  })

  it('ignores a unit when ZATCA is disabled', () => {
    const s = buildZatcaStatus({ env: null, business, entitlement: undefined, unit })
    expect(s).toMatchObject({ gate: 'ZATCA_DISABLED', unit: null, sandboxOtp: null })
  })
})
