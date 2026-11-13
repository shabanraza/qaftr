/**
 * Sign one invoice at the next ICV/PIH position of its EGS chain, store the
 * signed XML, then clear (standard) or report (simplified) it.
 *
 * The chain is serialized by a compare-and-swap on egs_units.last_icv (see
 * `IssueDeps.claim`): sign at lastIcv + 1, then advance only if nobody else
 * did. A lost race re-reads the chain and re-signs. Once claimed, an invoice
 * is never re-signed; failed submissions are retried with the same XML.
 */
import { ZatcaApiError, buildInvoiceXml, invoiceTypeName, signInvoice } from '@zatca/shared/zatca-phase2'
import type { SubmissionResult, ZatcaClient, ZatcaCredentials, ZatcaInvoiceSubtype } from '@zatca/shared/zatca-phase2'
import { InvoiceMappingError } from './invoice-mapping'
import type { InvoiceMappingErrorCode, ZatcaDocument } from './invoice-mapping'

export type ZatcaIssueStatus =
  | 'signed'
  | 'reported'
  | 'reported_with_warnings'
  | 'cleared'
  | 'cleared_with_warnings'
  | 'rejected'
  | 'pending_clearance'

export interface ChainClaim {
  prevIcv: number
  icv: number
  pih: string
  invoiceHash: string
  uuid: string
  subtype: ZatcaInvoiceSubtype
  invoiceTypeName: string
  qrPayload: string
  signedXmlKey: string
  issueDateKsa: string
  issueTimeKsa: string
  supplyDate: string | null
  signedAt: Date
  reportDueAt: Date | null
}

export interface IssueOutcome {
  status: ZatcaIssueStatus
  endpoint: 'reporting' | 'clearance'
  attempt: number
  httpStatus: number
  submissionStatus: string
  warnings: SubmissionResult['warnings']
  errors: SubmissionResult['errors']
  clearedXmlKey?: string
  /** For cleared invoices: the QR from ZATCA's stamped copy. */
  qrPayload?: string
  reportedAt?: Date
  lastError?: { codes: string[]; retryable: boolean; httpStatus: number }
  requestedAt: Date
  respondedAt: Date
}

export interface IssueDeps {
  readChain(): Promise<{ lastIcv: number; lastPih: string }>
  /** Atomically: advance the chain from prevIcv to icv and mark the invoice signed. False = lost the race. */
  claim(c: ChainClaim): Promise<boolean>
  putXml(key: string, xml: string): Promise<void>
  client: Pick<ZatcaClient, 'reportInvoice' | 'clearInvoice'>
  saveOutcome(o: IssueOutcome): Promise<void>
}

export interface SigningCredential extends ZatcaCredentials {
  certificateB64: string
  privateKey: Uint8Array
}

export type IssueErrorCode = InvoiceMappingErrorCode | 'CHAIN_BUSY'

export class IssueError extends Error {
  readonly code: IssueErrorCode
  constructor(code: IssueErrorCode, cause?: unknown) {
    super(code, { cause })
    this.name = 'IssueError'
    this.code = code
  }
}

const MAX_CLAIM_ATTEMPTS = 3
const REPORT_WINDOW_MS = 24 * 60 * 60 * 1000

export function qrFromXml(xml: string): string | undefined {
  const m = xml.match(
    /<cac:AdditionalDocumentReference>\s*<cbc:ID>QR<\/cbc:ID>[\s\S]*?<cbc:EmbeddedDocumentBinaryObject[^>]*>([^<]+)<\/cbc:EmbeddedDocumentBinaryObject>/,
  )
  return m?.[1]?.trim()
}

async function submitSafely(fn: () => Promise<SubmissionResult>): Promise<SubmissionResult> {
  try {
    return await fn()
  } catch (e) {
    const err = e as Partial<ZatcaApiError>
    if (e instanceof ZatcaApiError || err.name === 'ZatcaApiError') {
      return { ok: false, httpStatus: err.httpStatus ?? 0, status: '', info: [], warnings: [], errors: [], retryable: err.retryable ?? true }
    }
    throw e
  }
}

export async function issueInvoice(p: {
  deps: IssueDeps
  credential: SigningCredential
  /** R2 key prefix, e.g. zatca/{businessId}/{egsUnitId} */
  keyPrefix: string
  build: (chain: { icv: number; pih: string }, uuid: string, now: Date) => ZatcaDocument
  now?: () => Date
  uuid?: () => string
}): Promise<{ status: ZatcaIssueStatus; claim: ChainClaim }> {
  const now = p.now ?? (() => new Date())
  const uuid = (p.uuid ?? (() => crypto.randomUUID()))()
  const { deps, credential } = p

  let claim: ChainClaim | null = null
  let signedXml = ''
  for (let attempt = 0; attempt < MAX_CLAIM_ATTEMPTS && !claim; attempt++) {
    const chain = await deps.readChain()
    const at = now()
    let doc: ZatcaDocument
    try {
      doc = p.build({ icv: chain.lastIcv + 1, pih: chain.lastPih }, uuid, at)
    } catch (e) {
      if (e instanceof InvoiceMappingError) throw new IssueError(e.code, e)
      throw e
    }
    const signed = signInvoice({
      xml: buildInvoiceXml(doc.input, { now: at }),
      certificate: credential.certificateB64,
      privateKey: credential.privateKey,
      signingTime: at,
    })
    const candidate: ChainClaim = {
      prevIcv: chain.lastIcv,
      icv: doc.input.icv,
      pih: doc.input.pih,
      invoiceHash: signed.invoiceHash,
      uuid,
      subtype: doc.subtype,
      invoiceTypeName: invoiceTypeName(doc.subtype, doc.input.flags),
      qrPayload: signed.qr,
      signedXmlKey: `${p.keyPrefix}/${doc.input.icv}-${uuid}.xml`,
      issueDateKsa: doc.issueDateKsa,
      issueTimeKsa: doc.issueTimeKsa,
      supplyDate: doc.input.supplyDate ?? null,
      signedAt: at,
      reportDueAt: doc.subtype === 'simplified' ? new Date(at.getTime() + REPORT_WINDOW_MS) : null,
    }
    // Store first: an orphaned object (lost race) is harmless, a claimed invoice without its XML is not.
    await deps.putXml(candidate.signedXmlKey, signed.signedXml)
    if (await deps.claim(candidate)) {
      claim = candidate
      signedXml = signed.signedXml
    }
  }
  if (!claim) throw new IssueError('CHAIN_BUSY')

  const status = await submitClaimed({ deps, credential, claim, signedXml, now })
  return { status, claim }
}

/** Clear or report an already-signed invoice (also used by retries). */
export async function submitClaimed(p: {
  deps: Pick<IssueDeps, 'client' | 'putXml' | 'saveOutcome'>
  credential: ZatcaCredentials
  claim: Pick<ChainClaim, 'invoiceHash' | 'uuid' | 'subtype' | 'signedXmlKey'>
  signedXml: string
  now?: () => Date
  attempt?: number
}): Promise<ZatcaIssueStatus> {
  const now = p.now ?? (() => new Date())
  const creds = { binarySecurityToken: p.credential.binarySecurityToken, secret: p.credential.secret }
  const doc = { invoiceHash: p.claim.invoiceHash, uuid: p.claim.uuid, signedXml: p.signedXml }
  const requestedAt = now()

  let endpoint: IssueOutcome['endpoint'] = p.claim.subtype === 'standard' ? 'clearance' : 'reporting'
  let result = await submitSafely(() =>
    endpoint === 'clearance' ? p.deps.client.clearInvoice(creds, doc) : p.deps.client.reportInvoice(creds, doc),
  )
  if (endpoint === 'clearance' && result.httpStatus === 303) {
    endpoint = 'reporting'
    result = await submitSafely(() => p.deps.client.reportInvoice(creds, doc))
  }

  const warned = result.status === 'WARNING' || result.warnings.length > 0
  let status: ZatcaIssueStatus
  if (result.ok) {
    if (endpoint === 'clearance') status = warned ? 'cleared_with_warnings' : 'cleared'
    else status = warned ? 'reported_with_warnings' : 'reported'
  } else if (result.retryable) {
    status = endpoint === 'clearance' ? 'pending_clearance' : 'signed'
  } else {
    status = 'rejected'
  }

  const outcome: IssueOutcome = {
    status,
    endpoint,
    attempt: p.attempt ?? 1,
    httpStatus: result.httpStatus,
    submissionStatus: result.status,
    warnings: result.warnings,
    errors: result.errors,
    requestedAt,
    respondedAt: now(),
  }
  if (result.ok && endpoint === 'reporting') outcome.reportedAt = outcome.respondedAt
  if (result.ok && result.clearedInvoiceXml) {
    outcome.clearedXmlKey = p.claim.signedXmlKey.replace(/\.xml$/, '-cleared.xml')
    await p.deps.putXml(outcome.clearedXmlKey, result.clearedInvoiceXml)
    outcome.qrPayload = qrFromXml(result.clearedInvoiceXml)
  }
  if (!result.ok) {
    outcome.lastError = { codes: result.errors.map((m) => m.code).filter(Boolean), retryable: result.retryable, httpStatus: result.httpStatus }
  }
  await p.deps.saveOutcome(outcome)
  return status
}
