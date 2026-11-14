// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { FIRST_INVOICE_PIH, verifySignedInvoice } from '@zatca/shared/zatca-phase2'
import type { SubmissionResult, SubmitDocument } from '@zatca/shared/zatca-phase2'
import { TEST_SIGNER_KEY, createTestCertificate } from '../../../../packages/shared/src/zatca-phase2/fixtures'
import { toZatcaDocument } from './invoice-mapping'
import type { MappingInput } from './invoice-mapping'
import { IssueError, issueInvoice } from './issue'
import type { ChainClaim, IssueDeps, IssueOutcome } from './issue'

const certB64 = Buffer.from(createTestCertificate(TEST_SIGNER_KEY)).toString('base64')
const credential = { certificateB64: certB64, privateKey: TEST_SIGNER_KEY, binarySecurityToken: 'tok', secret: 'sec' }
const now = new Date('2026-11-13T09:00:00Z')
const OTHER_HASH = Buffer.alloc(32, 0xab).toString('base64')

const mapping: Omit<MappingInput, 'chain' | 'uuid' | 'now'> = {
  env: 'simulation',
  invoice: { seqNumber: 3, subtotal: '100.00', vatAmount: '15.00', total: '115.00', notes: null },
  items: [{ description: 'Item', qty: '1', unitPrice: '100', vatCategory: 'S', vatRate: '15', exemptionCode: null, exemptionReason: null, discountPerUnit: null }],
  business: {
    nameAr: 'مؤسسة قافتر', nameEn: null, vatNumber: '300000000000003', crNumber: '1010010000', street: 'King Fahd Road',
    buildingNumber: '1234', additionalNumber: null, district: 'Al Olaya', city: 'Riyadh', postalCode: '12211',
  },
  client: null,
}
const b2b = {
  name: 'Buyer LLC', vatNumber: '310000000000003', country: 'SA', idScheme: null, idValue: null, street: 'Prince Sultan St',
  buildingNumber: '4321', additionalNumber: null, district: 'Al Rawdah', city: 'Jeddah', postalCode: '23435',
}

const pass = (over: Partial<SubmissionResult> = {}): SubmissionResult => ({
  ok: true, httpStatus: 200, status: 'PASS', info: [], warnings: [], errors: [], retryable: false, ...over,
})

function fakeDeps(opts: {
  chain?: { lastIcv: number; lastPih: string }
  report?: (d: SubmitDocument) => Promise<SubmissionResult>
  clear?: (d: SubmitDocument) => Promise<SubmissionResult>
  loseRaces?: number
} = {}) {
  const state = {
    chain: opts.chain ?? { lastIcv: 4, lastPih: FIRST_INVOICE_PIH },
    claims: [] as ChainClaim[],
    xml: new Map<string, string>(),
    outcomes: [] as IssueOutcome[],
    calls: [] as string[],
    races: opts.loseRaces ?? 0,
  }
  const deps: IssueDeps = {
    readChain: async () => ({ ...state.chain }),
    claim: async (c) => {
      if (state.races > 0) {
        // Another invoice took this position first.
        state.races -= 1
        state.chain = { lastIcv: state.chain.lastIcv + 1, lastPih: OTHER_HASH }
        return false
      }
      if (c.prevIcv !== state.chain.lastIcv) return false
      state.chain = { lastIcv: c.icv, lastPih: c.invoiceHash }
      state.claims.push(c)
      return true
    },
    putXml: async (k, x) => void state.xml.set(k, x),
    client: {
      reportInvoice: async (_c, d) => (state.calls.push('report'), opts.report ? opts.report(d) : pass({ reportingStatus: 'REPORTED' })),
      clearInvoice: async (_c, d) => (state.calls.push('clear'), opts.clear ? opts.clear(d) : pass({ clearanceStatus: 'CLEARED', clearedInvoiceXml: d.signedXml.replace('</Invoice>', '<!--stamped--></Invoice>') })),
    },
    saveOutcome: async (o) => void state.outcomes.push(o),
  }
  return { deps, state }
}

const run = (deps: IssueDeps, client: MappingInput['client'] = null) =>
  issueInvoice({
    deps,
    credential,
    keyPrefix: 'zatca/biz/egs',
    now: () => now,
    uuid: () => '6f1c8a52-2c1e-4c6b-9a57-0d5b4f3f2a10',
    build: (chain, uuid, at) => toZatcaDocument({ ...mapping, client, chain, uuid, now: at }),
  })

describe('issueInvoice', () => {
  it('signs a simplified invoice at the next chain position, stores the XML, and reports it', async () => {
    const { deps, state } = fakeDeps()
    const r = await run(deps)
    expect(state.claims).toHaveLength(1)
    const claim = state.claims[0]!
    expect(claim).toMatchObject({ prevIcv: 4, icv: 5, pih: FIRST_INVOICE_PIH, subtype: 'simplified', invoiceTypeName: '0200000' })
    const xml = state.xml.get(claim.signedXmlKey)!
    expect(claim.signedXmlKey).toBe('zatca/biz/egs/5-6f1c8a52-2c1e-4c6b-9a57-0d5b4f3f2a10.xml')
    expect(xml).toContain('<cbc:UUID>5</cbc:UUID>')
    expect(verifySignedInvoice(xml).valid).toBe(true)
    expect(claim.qrPayload.length).toBeGreaterThan(50)
    expect(claim.reportDueAt).toEqual(new Date(now.getTime() + 24 * 3600 * 1000))
    expect(state.calls).toEqual(['report'])
    expect(r.status).toBe('reported')
    expect(state.outcomes[0]).toMatchObject({ status: 'reported', endpoint: 'reporting', httpStatus: 200, submissionStatus: 'PASS' })
  })

  it('clears a standard invoice synchronously and keeps ZATCA’s stamped copy and QR', async () => {
    const { deps, state } = fakeDeps()
    const r = await run(deps, b2b)
    expect(state.calls).toEqual(['clear'])
    expect(state.claims[0]).toMatchObject({ subtype: 'standard', invoiceTypeName: '0100000' })
    expect(r.status).toBe('cleared')
    const o = state.outcomes[0]!
    expect(o.clearedXmlKey).toBe('zatca/biz/egs/5-6f1c8a52-2c1e-4c6b-9a57-0d5b4f3f2a10-cleared.xml')
    expect(state.xml.get(o.clearedXmlKey!)).toContain('<!--stamped-->')
    expect(o.qrPayload).toBeTruthy()
  })

  it('re-reads the chain and re-signs when another invoice took the position first', async () => {
    const { deps, state } = fakeDeps({ loseRaces: 1 })
    await run(deps)
    expect(state.claims).toHaveLength(1)
    expect(state.claims[0]).toMatchObject({ prevIcv: 5, icv: 6, pih: OTHER_HASH })
  })

  it('gives up after repeated races without submitting anything', async () => {
    const { deps, state } = fakeDeps({ loseRaces: 10 })
    await expect(run(deps)).rejects.toMatchObject({ code: 'CHAIN_BUSY' })
    expect(state.calls).toEqual([])
  })

  it('maps warnings and rejections', async () => {
    const warn = fakeDeps({ report: async () => pass({ status: 'WARNING', warnings: [{ type: 'WARNING', code: 'BR-KSA-08', category: 'KSA', message: 'm', status: 'WARNING' }] }) })
    expect((await run(warn.deps)).status).toBe('reported_with_warnings')

    const rej = fakeDeps({ clear: async () => pass({ ok: false, httpStatus: 400, status: 'ERROR', errors: [{ type: 'ERROR', code: 'BR-KSA-63', category: 'KSA', message: 'm', status: 'ERROR' }] }) })
    const r = await run(rej.deps, b2b)
    expect(r.status).toBe('rejected')
    expect(rej.state.outcomes[0]).toMatchObject({ status: 'rejected', lastError: { codes: ['BR-KSA-63'] } })
  })

  it('reports a standard invoice instead when ZATCA has clearance switched off', async () => {
    const { deps, state } = fakeDeps({ clear: async () => pass({ ok: false, httpStatus: 303, status: 'CLEARANCE_DISABLED' }) })
    const r = await run(deps, b2b)
    expect(state.calls).toEqual(['clear', 'report'])
    expect(r.status).toBe('reported')
  })

  it('keeps a signed invoice queued when ZATCA cannot be reached (never re-signs)', async () => {
    const down = fakeDeps({ report: async () => { throw Object.assign(new Error('ZATCA network error'), { name: 'ZatcaApiError', httpStatus: 0, retryable: true }) } })
    const r = await run(down.deps)
    expect(r.status).toBe('signed')
    expect(down.state.claims).toHaveLength(1)
    expect(down.state.outcomes[0]).toMatchObject({ status: 'signed', httpStatus: 0, lastError: { retryable: true } })

    const downB2b = fakeDeps({ clear: async () => pass({ ok: false, httpStatus: 503, status: '', retryable: true }) })
    expect((await run(downB2b.deps, b2b)).status).toBe('pending_clearance')
  })

  it('surfaces mapping problems before touching the chain', async () => {
    const { deps, state } = fakeDeps()
    const err = await issueInvoice({
      deps,
      credential,
      keyPrefix: 'k',
      now: () => now,
      build: (chain, uuid, at) => toZatcaDocument({ ...mapping, client: { ...b2b, postalCode: null }, chain, uuid, now: at }),
    }).catch((e: unknown) => e)
    expect(err).toBeInstanceOf(IssueError)
    expect(err).toMatchObject({ code: 'BUYER_NOT_READY' })
    expect(state.claims).toEqual([])
  })
})
