// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { FIRST_INVOICE_PIH } from '@zatca/shared/zatca-phase2'
import { generateKekBase64, openCredentialSecrets } from './credential-crypto'
import type { KeyRing } from './credential-crypto'
import { onboardingGate, resolveZatcaEnv, toEgsRecords } from './egs-records'
import type { OnboardingResult } from './onboarding'

describe('resolveZatcaEnv', () => {
  it('is disabled unless ZATCA_ENV names a known environment', () => {
    expect(resolveZatcaEnv({})).toBeNull()
    expect(resolveZatcaEnv({ ZATCA_ENV: 'staging' })).toBeNull()
    expect(resolveZatcaEnv({ ZATCA_ENV: ' Sandbox ' })).toBe('sandbox')
    expect(resolveZatcaEnv({ ZATCA_ENV: 'production' })).toBe('production')
  })
})

describe('onboardingGate', () => {
  it('lets anyone try the sandbox but needs an active Pro plan for real environments', () => {
    expect(onboardingGate({ env: null, entitlement: undefined })).toBe('ZATCA_DISABLED')
    expect(onboardingGate({ env: 'sandbox', entitlement: undefined })).toBeNull()
    expect(onboardingGate({ env: 'simulation', entitlement: undefined })).toBe('ZATCA_PRO_REQUIRED')
    expect(onboardingGate({ env: 'production', entitlement: { plan: 'pro', status: 'past_due' } })).toBe('ZATCA_PRO_REQUIRED')
    expect(onboardingGate({ env: 'production', entitlement: { plan: 'pro', status: 'active' } })).toBeNull()
  })
})

describe('toEgsRecords', () => {
  const ring: KeyRing = { current: 1, keks: { 1: generateKekBase64() } }
  const cred = (id: string) => ({
    requestId: id,
    binarySecurityToken: `token-${id}`,
    secret: `secret-${id}`,
    certificateB64: `cert-${id}`,
    issuedAt: new Date('2026-11-13T00:00:00Z'),
    notAfter: new Date('2031-11-13T00:00:00Z'),
    publicKeyMatches: id === 'c',
  })
  const result: OnboardingResult = {
    unit: {
      env: 'sandbox',
      commonName: 'Qaftr-EGS-abcd1234',
      branchName: 'Head Office',
      egsSerial: '1-Qaftr|2-Web|3-x',
      invoiceTypeFlags: '1100',
      location: 'Riyadh',
      industry: 'Retail',
      organizationName: 'x',
      vatNumber: '399999999900003',
    },
    privateKeyPem: '-----BEGIN EC PRIVATE KEY-----\nabc\n-----END EC PRIVATE KEY-----',
    compliance: cred('c'),
    production: cred('p'),
  }
  let n = 0
  const ids = () => `id-${++n}`

  it('builds an active unit pointing at the sealed production credential, with a fresh chain', async () => {
    const r = await toEgsRecords({ businessId: 'biz', result, ring, newId: ids })
    expect(r.unit).toMatchObject({
      businessId: 'biz',
      env: 'sandbox',
      status: 'active',
      lastIcv: 0,
      lastPih: FIRST_INVOICE_PIH,
      activeCredentialId: r.credentials[1]!.id,
      certNotAfter: result.production.notAfter,
    })
    expect(r.credentials.map((c) => [c.kind, c.egsUnitId, c.requestId])).toEqual([
      ['compliance', r.unit.id, 'c'],
      ['production', r.unit.id, 'p'],
    ])
    for (const c of r.credentials) {
      const all = JSON.stringify(c)
      expect(all).not.toContain('secret-')
      expect(all).not.toContain('token-')
      expect(all).not.toContain('BEGIN EC PRIVATE KEY')
    }
    const opened = await openCredentialSecrets(r.credentials[1]!.id, r.credentials[1]!, ring)
    expect(opened).toEqual({ privateKeyPem: result.privateKeyPem, binarySecurityToken: 'token-p', secret: 'secret-p' })
  })
})
