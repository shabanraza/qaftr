// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { FIRST_INVOICE_PIH, ZatcaApiError, parseXml, publicKeyFromPrivate, verifySignedInvoice } from '@zatca/shared/zatca-phase2'
import type { CsidResult, SubmissionResult, SubmitDocument, ZatcaClient, ZatcaCredentials } from '@zatca/shared/zatca-phase2'
import { TEST_SIGNER_KEY, createTestCertificate } from '../../../../packages/shared/src/zatca-phase2/fixtures'
import { OnboardingError, onboardEgs } from './onboarding'
import type { OnboardingSeller } from './onboarding'

const SELLER: OnboardingSeller = {
  businessId: 'biz_123456789',
  nameAr: 'مؤسسة قافتر التجارية',
  nameEn: 'Qaftr Trading',
  vatNumber: '300000000000003',
  crNumber: '1010010000',
  street: 'King Fahd Road',
  buildingNumber: '1234',
  additionalNumber: null,
  district: 'Al Olaya',
  city: 'Riyadh',
  postalCode: '12211',
}

const certB64 = Buffer.from(createTestCertificate(TEST_SIGNER_KEY)).toString('base64')
const token = Buffer.from(certB64, 'utf8').toString('base64')
const pass = (): SubmissionResult => ({ ok: true, httpStatus: 200, status: 'PASS', info: [], warnings: [], errors: [], retryable: false })

function mockClient(overrides: Partial<ZatcaClient> = {}) {
  const calls = { csr: '', otp: '', docs: [] as SubmitDocument[], productionAuth: null as ZatcaCredentials | null, requestId: '' }
  const client = {
    async requestComplianceCsid(p: { csrBase64: string; otp: string }): Promise<CsidResult> {
      calls.csr = p.csrBase64
      calls.otp = p.otp
      return { requestId: '1234567890123', binarySecurityToken: token, secret: 'ccsid-secret' }
    },
    async checkComplianceInvoice(_c: ZatcaCredentials, doc: SubmitDocument) {
      calls.docs.push(doc)
      return pass()
    },
    async requestProductionCsid(c: ZatcaCredentials, p: { complianceRequestId: string }): Promise<CsidResult> {
      calls.productionAuth = c
      calls.requestId = p.complianceRequestId
      return { requestId: '9999', binarySecurityToken: token, secret: 'pcsid-secret' }
    },
    ...overrides,
  } as unknown as ZatcaClient
  return { client, calls }
}

const base = {
  env: 'sandbox' as const,
  otp: '123345',
  industry: 'Retail',
  generateKeyPair: () => ({ privateKey: TEST_SIGNER_KEY, publicKey: publicKeyFromPrivate(TEST_SIGNER_KEY) }),
  now: () => new Date('2026-11-13T09:00:00Z'),
}

describe('onboardEgs', () => {
  it('runs CSR → compliance CSID → 6 signed compliance documents → production CSID', async () => {
    const { client, calls } = mockClient()
    const r = await onboardEgs({ ...base, seller: SELLER, client })

    expect(calls.otp).toBe('123345')
    const csrPem = atob(calls.csr)
    expect(csrPem).toContain('BEGIN CERTIFICATE REQUEST')

    // simplified + standard × invoice, credit note, debit note
    expect(calls.docs).toHaveLength(6)
    const kinds = calls.docs.map((d) => {
      const root = parseXml(d.signedXml).root
      return `${root.name}:${d.signedXml.match(/<cbc:InvoiceTypeCode name="(\d+)">(\d+)</)!.slice(1).join('/')}`
    })
    expect(kinds).toEqual([
      'Invoice:0200000/388',
      'Invoice:0200000/381',
      'Invoice:0200000/383',
      'Invoice:0100000/388',
      'Invoice:0100000/381',
      'Invoice:0100000/383',
    ])
    // ICV/PIH chain: each document points at the previous hash.
    let pih = FIRST_INVOICE_PIH
    calls.docs.forEach((doc, i) => {
      expect(doc.signedXml).toContain(`<cbc:UUID>${i + 1}</cbc:UUID>`)
      expect(doc.signedXml).toContain(pih)
      expect(verifySignedInvoice(doc.signedXml).valid).toBe(true)
      pih = doc.invoiceHash
    })

    expect(calls.productionAuth).toEqual({ binarySecurityToken: token, secret: 'ccsid-secret' })
    expect(calls.requestId).toBe('1234567890123')

    expect(r.unit).toMatchObject({
      env: 'sandbox',
      invoiceTypeFlags: '1100',
      industry: 'Retail',
      location: 'Riyadh',
      organizationName: SELLER.nameAr,
    })
    expect(r.unit.egsSerial).toMatch(/^1-Qaftr\|2-Web\|3-[0-9a-f-]{36}$/)
    expect(r.privateKeyPem).toContain('BEGIN EC PRIVATE KEY')
    expect(r.compliance).toMatchObject({ requestId: '1234567890123', secret: 'ccsid-secret', publicKeyMatches: true })
    expect(r.production).toMatchObject({ requestId: '9999', secret: 'pcsid-secret', publicKeyMatches: true })
    expect(r.production.notAfter).toBeInstanceOf(Date)
  })

  it('uses the documented sandbox VAT number only in the sandbox', async () => {
    const { client, calls } = mockClient()
    await onboardEgs({ ...base, seller: SELLER, client })
    expect(calls.docs[0]!.signedXml).toContain('399999999900003')
    const sim = mockClient()
    await onboardEgs({ ...base, env: 'simulation', otp: '654321', seller: SELLER, client: sim.client })
    expect(sim.calls.docs[0]!.signedXml).toContain(SELLER.vatNumber)
    expect(sim.calls.docs[0]!.signedXml).not.toContain('399999999900003')
  })

  it('refuses a seller whose profile is not ready, before calling ZATCA', async () => {
    const { client, calls } = mockClient()
    await expect(onboardEgs({ ...base, seller: { ...SELLER, crNumber: null }, client })).rejects.toMatchObject({
      code: 'SELLER_NOT_READY',
    })
    expect(calls.otp).toBe('')
  })

  it('requires a 6-digit OTP and an industry', async () => {
    const { client } = mockClient()
    await expect(onboardEgs({ ...base, otp: '12ab', seller: SELLER, client })).rejects.toMatchObject({ code: 'OTP_INVALID' })
    await expect(onboardEgs({ ...base, industry: ' ', seller: SELLER, client })).rejects.toMatchObject({ code: 'INDUSTRY_REQUIRED' })
  })

  it('maps a rejected OTP and an unreachable ZATCA to clear error codes', async () => {
    const rejected = mockClient({
      requestComplianceCsid: async () => {
        throw new ZatcaApiError('ZATCA POST /compliance failed with HTTP 400', 400, false, { errors: [{ code: 'Invalid-OTP' }] })
      },
    })
    await expect(onboardEgs({ ...base, seller: SELLER, client: rejected.client })).rejects.toMatchObject({ code: 'OTP_REJECTED' })

    const down = mockClient({
      requestComplianceCsid: async () => {
        throw new ZatcaApiError('ZATCA network error', 0, true)
      },
    })
    const err = await onboardEgs({ ...base, seller: SELLER, client: down.client }).catch((e: unknown) => e)
    expect(err).toBeInstanceOf(OnboardingError)
    expect(err).toMatchObject({ code: 'ZATCA_UNAVAILABLE', retryable: true })
  })

  it('stops at the first failed compliance document and reports ZATCA’s messages', async () => {
    const { client, calls } = mockClient({
      checkComplianceInvoice: async () => ({
        ...pass(),
        ok: false,
        httpStatus: 400,
        status: 'ERROR',
        errors: [{ type: 'ERROR', code: 'BR-KSA-37', category: 'KSA', message: 'Building number must be 4 digits', status: 'ERROR' }],
      }),
    })
    const err = (await onboardEgs({ ...base, seller: SELLER, client }).catch((e: unknown) => e)) as OnboardingError
    expect(err.code).toBe('COMPLIANCE_CHECK_FAILED')
    expect(err.details).toEqual([{ document: 'simplified-invoice', codes: ['BR-KSA-37'] }])
    expect(calls.productionAuth).toBeNull()
  })
})
