/**
 * EGS onboarding with ZATCA (Phase 2): key pair → CSR → compliance CSID (OTP)
 * → 6 signed compliance documents → production CSID.
 *
 * Pure orchestration: the ZATCA client, key generator, clock and UUIDs are
 * injected. Nothing here touches the database; the caller seals the returned
 * private key and secrets (credential-crypto) before persisting them.
 */
import { normalizePartyInput, sellerZatcaReadiness } from '@zatca/shared'
import type { PartyIssue } from '@zatca/shared'
import {
  FIRST_INVOICE_PIH,
  ZatcaApiError,
  buildInvoiceXml,
  buildZatcaCsr,
  certificateFromBinarySecurityToken,
  egsSerialNumber,
  generateZatcaKeyPair,
  privateKeyToPem,
  signInvoice,
} from '@zatca/shared/zatca-phase2'
import type {
  CsidResult,
  ZatcaClient,
  ZatcaDocumentKind,
  ZatcaInvoiceInput,
  ZatcaInvoiceSubtype,
  ZatcaKeyPair,
  ZatcaSeller,
} from '@zatca/shared/zatca-phase2'

export type OnboardingEnv = 'sandbox' | 'simulation' | 'production'

/** Documented developer-portal sandbox taxpayer (not a real VAT number). */
export const ZATCA_SANDBOX_VAT = '399999999900003'
/** Constructed buyer for the standard (B2B) compliance samples. */
const SAMPLE_BUYER_VAT = '399999999800003'

export interface OnboardingSeller {
  businessId: string
  nameAr: string | null
  nameEn: string | null
  vatNumber: string | null
  crNumber: string | null
  street: string | null
  buildingNumber: string | null
  additionalNumber: string | null
  district: string | null
  city: string | null
  postalCode: string | null
}

export type OnboardingErrorCode =
  | 'SELLER_NOT_READY'
  | 'OTP_INVALID'
  | 'INDUSTRY_REQUIRED'
  | 'OTP_REJECTED'
  | 'CSR_REJECTED'
  | 'COMPLIANCE_CHECK_FAILED'
  | 'PRODUCTION_CSID_FAILED'
  | 'ZATCA_UNAVAILABLE'

export interface ComplianceFailure {
  document: string
  codes: string[]
}

export class OnboardingError extends Error {
  readonly code: OnboardingErrorCode
  readonly retryable: boolean
  readonly details?: PartyIssue[] | ComplianceFailure[]
  constructor(code: OnboardingErrorCode, opts: { retryable?: boolean; details?: PartyIssue[] | ComplianceFailure[]; cause?: unknown } = {}) {
    super(code, { cause: opts.cause })
    this.name = 'OnboardingError'
    this.code = code
    this.retryable = opts.retryable ?? false
    this.details = opts.details
  }
}

export interface IssuedCredential {
  requestId: string
  binarySecurityToken: string
  secret: string
  certificateB64: string
  issuedAt: Date
  notAfter: Date
  /** False in the sandbox, whose production CSID is not bound to our key. */
  publicKeyMatches: boolean
}

export interface OnboardingResult {
  unit: {
    env: OnboardingEnv
    commonName: string
    branchName: string
    egsSerial: string
    invoiceTypeFlags: '1100'
    location: string
    industry: string
    organizationName: string
    vatNumber: string
  }
  privateKeyPem: string
  compliance: IssuedCredential
  production: IssuedCredential
}

export interface OnboardEgsInput {
  seller: OnboardingSeller
  env: OnboardingEnv
  otp: string
  industry: string
  branchName?: string
  client: ZatcaClient
  generateKeyPair?: () => ZatcaKeyPair
  now?: () => Date
  uuid?: () => string
}

const COMPLIANCE_DOCS: ReadonlyArray<readonly [ZatcaInvoiceSubtype, ZatcaDocumentKind]> = [
  ['simplified', 'invoice'],
  ['simplified', 'credit-note'],
  ['simplified', 'debit-note'],
  ['standard', 'invoice'],
  ['standard', 'credit-note'],
  ['standard', 'debit-note'],
]

const NOTE_REASON: Record<ZatcaDocumentKind, string | undefined> = {
  invoice: undefined,
  'credit-note': 'Returned goods',
  'debit-note': 'Price adjustment',
}

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i])
}

function issued(c: CsidResult, keyPair: ZatcaKeyPair): IssuedCredential {
  const cert = certificateFromBinarySecurityToken(c.binarySecurityToken)
  return {
    requestId: c.requestId,
    binarySecurityToken: c.binarySecurityToken,
    secret: c.secret,
    certificateB64: cert.base64,
    issuedAt: cert.notBefore,
    notAfter: cert.notAfter,
    publicKeyMatches: bytesEqual(cert.publicKey, keyPair.publicKey),
  }
}

function zatcaFailure(e: unknown, fallback: OnboardingErrorCode): OnboardingError {
  if (e instanceof ZatcaApiError && (e.retryable || e.httpStatus === 0)) {
    return new OnboardingError('ZATCA_UNAVAILABLE', { retryable: true, cause: e })
  }
  return new OnboardingError(fallback, { cause: e })
}

export async function onboardEgs(input: OnboardEgsInput): Promise<OnboardingResult> {
  const now = input.now ?? (() => new Date())
  const uuid = input.uuid ?? (() => crypto.randomUUID())

  const readiness = sellerZatcaReadiness({ ...input.seller, name: input.seller.nameAr })
  if (!readiness.ready) throw new OnboardingError('SELLER_NOT_READY', { details: readiness.issues })
  const otp = input.otp.trim()
  if (!/^\d{6}$/.test(otp)) throw new OnboardingError('OTP_INVALID')
  const industry = input.industry.trim()
  if (!industry) throw new OnboardingError('INDUSTRY_REQUIRED')

  const p = normalizePartyInput({ ...input.seller, name: input.seller.nameAr })
  const vatNumber = input.env === 'sandbox' ? ZATCA_SANDBOX_VAT : p.vatNumber!
  const organizationName = p.name!
  const location = p.city!
  const branchName = input.branchName?.trim() || 'Head Office'
  const serial = uuid()
  const egsSerial = egsSerialNumber({ solutionName: 'Qaftr', model: 'Web', serial })
  const commonName = `Qaftr-EGS-${serial.slice(0, 8)}`

  const keyPair = (input.generateKeyPair ?? generateZatcaKeyPair)()
  const csr = buildZatcaCsr(
    {
      environment: input.env,
      commonName,
      organizationName,
      organizationUnitName: branchName,
      egsSerialNumber: egsSerial,
      vatNumber,
      invoiceTypes: '1100',
      location,
      industry,
    },
    keyPair.privateKey,
  )

  // 1) Compliance CSID
  let ccsid: CsidResult
  try {
    ccsid = await input.client.requestComplianceCsid({ csrBase64: csr.base64ForApi, otp })
  } catch (e) {
    if (e instanceof ZatcaApiError && !e.retryable && e.httpStatus >= 400 && e.httpStatus < 500) {
      const body = JSON.stringify(e.body ?? '').toLowerCase()
      throw new OnboardingError(body.includes('csr') && !body.includes('otp') ? 'CSR_REJECTED' : 'OTP_REJECTED', { cause: e })
    }
    throw zatcaFailure(e, 'OTP_REJECTED')
  }
  const compliance = issued(ccsid, keyPair)
  const ccsidCreds = { binarySecurityToken: ccsid.binarySecurityToken, secret: ccsid.secret }

  // 2) Compliance documents, chained by ICV/PIH from the first-invoice hash.
  const seller: ZatcaSeller = {
    registrationName: organizationName,
    vatNumber,
    otherId: { scheme: 'CRN', value: p.crNumber! },
    address: {
      street: p.street!,
      buildingNumber: p.buildingNumber!,
      ...(p.additionalNumber ? { plotIdentification: p.additionalNumber } : {}),
      district: p.district!,
      city: p.city!,
      postalCode: p.postalCode!,
      country: 'SA',
    },
  }
  const at = now()
  const issueDate = at.toISOString().slice(0, 10)
  const issueTime = at.toISOString().slice(11, 19)
  let pih = FIRST_INVOICE_PIH
  let icv = 0
  for (const [subtype, kind] of COMPLIANCE_DOCS) {
    icv += 1
    const doc: ZatcaInvoiceInput = {
      kind,
      subtype,
      id: `CMP-${icv}`,
      uuid: uuid(),
      issueDate,
      issueTime,
      icv,
      pih,
      seller,
      paymentMeansCode: '10',
      lines: [{ name: 'Compliance sample item', quantity: 1, unitPrice: 100, vatCategory: 'S', vatRate: 15 }],
      ...(subtype === 'standard'
        ? {
            supplyDate: issueDate,
            buyer: {
              registrationName: 'Sample Buyer Co',
              vatNumber: SAMPLE_BUYER_VAT,
              address: {
                street: 'Prince Sultan St',
                buildingNumber: '4321',
                district: 'Al Rawdah',
                city: 'Jeddah',
                postalCode: '23435',
                country: 'SA',
              },
            },
          }
        : {}),
      ...(kind === 'invoice'
        ? {}
        : { billingReference: { invoiceId: subtype === 'standard' ? 'CMP-4' : 'CMP-1' }, noteReason: NOTE_REASON[kind] }),
    }
    const signed = signInvoice({
      xml: buildInvoiceXml(doc),
      certificate: compliance.certificateB64,
      privateKey: keyPair.privateKey,
      signingTime: at,
    })
    const label = `${subtype}-${kind === 'invoice' ? 'invoice' : kind}`
    let result
    try {
      result = await input.client.checkComplianceInvoice(ccsidCreds, {
        invoiceHash: signed.invoiceHash,
        uuid: doc.uuid,
        signedXml: signed.signedXml,
      })
    } catch (e) {
      throw zatcaFailure(e, 'COMPLIANCE_CHECK_FAILED')
    }
    if (!result.ok) {
      if (result.retryable) throw new OnboardingError('ZATCA_UNAVAILABLE', { retryable: true })
      throw new OnboardingError('COMPLIANCE_CHECK_FAILED', {
        details: [{ document: label, codes: result.errors.map((m) => m.code).filter(Boolean) }],
      })
    }
    pih = signed.invoiceHash
  }

  // 3) Production CSID
  let pcsid: CsidResult
  try {
    pcsid = await input.client.requestProductionCsid(ccsidCreds, { complianceRequestId: ccsid.requestId })
  } catch (e) {
    throw zatcaFailure(e, 'PRODUCTION_CSID_FAILED')
  }

  return {
    unit: {
      env: input.env,
      commonName,
      branchName,
      egsSerial,
      invoiceTypeFlags: '1100',
      location,
      industry,
      organizationName,
      vatNumber,
    },
    privateKeyPem: privateKeyToPem(keyPair.privateKey),
    compliance,
    production: issued(pcsid, keyPair),
  }
}
