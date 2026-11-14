/**
 * Resend an already-signed invoice from its stored XML (Retry button and the
 * cron sweeper). Server-only.
 */
import { and, eq, inArray, sql } from 'drizzle-orm'
import { createZatcaClient } from '@zatca/shared/zatca-phase2'
import { db } from '#/db'
import { egsUnits, invoices, zatcaSubmissions } from '#/db/schema'
import { loadSigningCredential, saveOutcome } from './egs-store'
import type { SigningCredential, ZatcaIssueStatus } from './issue'
import { submitClaimed } from './issue'
import type { OnboardingEnv } from './onboarding'
import type { SweepCandidate, SweepSummary } from './sweeper'
import { sweepPending } from './sweeper'
import type { XmlStore } from './xml-store'

export interface SignedInvoiceRef {
  invoiceId: string
  egsUnitId: string
  activeCredentialId: string
  signedXmlKey: string
  invoiceHash: string
  zatcaUuid: string
  zatcaSubtype: 'standard' | 'simplified'
}

export async function resubmitInvoice(p: {
  ref: SignedInvoiceRef
  env: OnboardingEnv
  store: XmlStore
  attempt: number
  credential?: SigningCredential
}): Promise<ZatcaIssueStatus> {
  const { ref } = p
  const credential = p.credential ?? (await loadSigningCredential(ref.egsUnitId, ref.activeCredentialId))
  const signedXml = await p.store.get(ref.signedXmlKey)
  if (!signedXml) throw new Error(`Signed XML missing for invoice ${ref.invoiceId}`)
  return submitClaimed({
    deps: {
      client: createZatcaClient({ environment: p.env }),
      putXml: (k, x) => p.store.put(k, x),
      saveOutcome: (o) => saveOutcome(ref.egsUnitId, ref.invoiceId, o),
    },
    credential,
    claim: { invoiceHash: ref.invoiceHash, uuid: ref.zatcaUuid, subtype: ref.zatcaSubtype, signedXmlKey: ref.signedXmlKey },
    signedXml,
    attempt: p.attempt,
  })
}

type PendingRow = SweepCandidate & SignedInvoiceRef

async function loadPending(env: OnboardingEnv): Promise<PendingRow[]> {
  const rows = await db
    .select({
      invoiceId: invoices.id,
      egsUnitId: egsUnits.id,
      activeCredentialId: egsUnits.activeCredentialId,
      status: invoices.zatcaStatus,
      reportDueAt: invoices.reportDueAt,
      signedXmlKey: invoices.signedXmlKey,
      invoiceHash: invoices.invoiceHash,
      zatcaUuid: invoices.zatcaUuid,
      zatcaSubtype: invoices.zatcaSubtype,
      attempts: sql<number>`(select count(*)::int from ${zatcaSubmissions} s where s.invoice_id = ${invoices.id})`,
      lastAttemptAt: sql<string | null>`(select max(s.requested_at) from ${zatcaSubmissions} s where s.invoice_id = ${invoices.id})`,
    })
    .from(invoices)
    .innerJoin(egsUnits, eq(invoices.egsUnitId, egsUnits.id))
    .where(and(inArray(invoices.zatcaStatus, ['signed', 'pending_clearance']), eq(egsUnits.env, env)))
    .limit(500)
  return rows.flatMap((r) =>
    r.activeCredentialId && r.signedXmlKey && r.invoiceHash && r.zatcaUuid && r.zatcaSubtype
      ? [
          {
            invoiceId: r.invoiceId,
            egsUnitId: r.egsUnitId,
            activeCredentialId: r.activeCredentialId,
            status: r.status as SweepCandidate['status'],
            reportDueAt: r.reportDueAt,
            signedXmlKey: r.signedXmlKey,
            invoiceHash: r.invoiceHash,
            zatcaUuid: r.zatcaUuid,
            zatcaSubtype: r.zatcaSubtype,
            attempts: Number(r.attempts),
            // timestamp without time zone, stored as UTC
            lastAttemptAt: r.lastAttemptAt ? new Date(`${r.lastAttemptAt.replace(' ', 'T')}Z`) : null,
          },
        ]
      : [],
  )
}

/** One cron run: resend everything that is due. */
export async function runZatcaSweep(p: { env: OnboardingEnv; store: XmlStore; now?: Date }): Promise<SweepSummary> {
  const candidates = await loadPending(p.env)
  const credentials = new Map<string, Promise<SigningCredential>>()
  const summary = await sweepPending({
    candidates,
    now: p.now ?? new Date(),
    submit: (c, attempt) => {
      const ref = c as PendingRow
      if (!credentials.has(ref.egsUnitId)) credentials.set(ref.egsUnitId, loadSigningCredential(ref.egsUnitId, ref.activeCredentialId))
      return credentials.get(ref.egsUnitId)!.then((credential) => resubmitInvoice({ ref, env: p.env, store: p.store, attempt, credential }))
    },
  })
  if (summary.attempted || summary.overdue) console.log('[zatca] sweep', JSON.stringify(summary))
  if (summary.overdue) console.error('[zatca] invoices past the 24-hour reporting deadline', summary.overdue)
  return summary
}
