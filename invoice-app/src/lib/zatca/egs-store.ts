/**
 * Database side of invoice signing: the ICV/PIH compare-and-swap, credential
 * loading, and recording ZATCA outcomes. Server-only.
 */
import { and, eq, sql } from 'drizzle-orm'
import { privateKeyFromPem } from '@zatca/shared/zatca-phase2'
import { db } from '#/db'
import { egsUnits, invoices, zatcaCredentials, zatcaSubmissions } from '#/db/schema'
import { keyRingFromProcessEnv, openCredentialSecrets } from './credential-crypto'
import type { ChainClaim, IssueOutcome, SigningCredential } from './issue'

export async function readChain(egsUnitId: string) {
  const [row] = await db
    .select({ lastIcv: egsUnits.lastIcv, lastPih: egsUnits.lastPih })
    .from(egsUnits)
    .where(eq(egsUnits.id, egsUnitId))
    .limit(1)
  if (!row) throw new Error('EGS unit not found')
  return row
}

/**
 * One statement, so it is atomic: advance the EGS chain from prevIcv only if
 * the invoice is still unsigned, then stamp the invoice. Concurrent callers
 * serialize on the egs_units row; the loser sees last_icv moved and gets 0 rows.
 */
export async function claimChain(egsUnitId: string, invoiceId: string, c: ChainClaim): Promise<boolean> {
  const iso = (d: Date | null) => (d ? d.toISOString() : null)
  const res = await db.execute(sql`
    WITH chain AS (
      UPDATE egs_units
         SET last_icv = ${c.icv}, last_pih = ${c.invoiceHash}, updated_at = now()
       WHERE id = ${egsUnitId}
         AND last_icv = ${c.prevIcv}
         AND EXISTS (
           SELECT 1 FROM invoices
            WHERE id = ${invoiceId} AND icv IS NULL AND zatca_status IN ('not_required', 'draft')
         )
      RETURNING id
    )
    UPDATE invoices
       SET egs_unit_id = ${egsUnitId},
           zatca_kind = 'invoice',
           zatca_subtype = ${c.subtype},
           invoice_type_name = ${c.invoiceTypeName},
           zatca_uuid = ${c.uuid},
           icv = ${c.icv},
           pih = ${c.pih},
           invoice_hash = ${c.invoiceHash},
           qr_payload = ${c.qrPayload},
           signed_xml_key = ${c.signedXmlKey},
           issue_date_ksa = ${c.issueDateKsa},
           issue_time_ksa = ${c.issueTimeKsa},
           supply_date = ${c.supplyDate},
           zatca_status = 'signed',
           zatca_last_error = NULL,
           signed_at = ${iso(c.signedAt)},
           report_due_at = ${iso(c.reportDueAt)},
           updated_at = now()
     WHERE id = ${invoiceId} AND EXISTS (SELECT 1 FROM chain)
    RETURNING id`)
  return res.rows.length === 1
}

export async function saveOutcome(egsUnitId: string, invoiceId: string, o: IssueOutcome): Promise<void> {
  await db.batch([
    db
      .update(invoices)
      .set({
        zatcaStatus: o.status,
        zatcaLastError: o.lastError ?? null,
        ...(o.reportedAt ? { reportedAt: o.reportedAt } : {}),
        ...(o.clearedXmlKey ? { clearedXmlKey: o.clearedXmlKey } : {}),
        ...(o.qrPayload ? { qrPayload: o.qrPayload } : {}),
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, invoiceId)),
    db.insert(zatcaSubmissions).values({
      id: crypto.randomUUID(),
      invoiceId,
      egsUnitId,
      endpoint: o.endpoint,
      attempt: o.attempt,
      httpStatus: o.httpStatus,
      status: o.submissionStatus || null,
      warnings: o.warnings,
      errors: o.errors,
      requestedAt: o.requestedAt,
      respondedAt: o.respondedAt,
    }),
  ])
}

export async function submissionCount(invoiceId: string): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(zatcaSubmissions)
    .where(eq(zatcaSubmissions.invoiceId, invoiceId))
  return row?.n ?? 0
}

/** The active production credential of an EGS unit, decrypted for signing. */
export async function loadSigningCredential(egsUnitId: string, credentialId: string): Promise<SigningCredential> {
  const [row] = await db
    .select()
    .from(zatcaCredentials)
    .where(and(eq(zatcaCredentials.id, credentialId), eq(zatcaCredentials.egsUnitId, egsUnitId)))
    .limit(1)
  if (!row || row.revokedAt) throw new Error('EGS credential not found')
  const secrets = await openCredentialSecrets(row.id, row, keyRingFromProcessEnv())
  return {
    certificateB64: row.certificateB64,
    privateKey: privateKeyFromPem(secrets.privateKeyPem),
    binarySecurityToken: secrets.binarySecurityToken,
    secret: secrets.secret,
  }
}
