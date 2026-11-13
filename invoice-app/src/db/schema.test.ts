// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { getTableConfig } from 'drizzle-orm/pg-core'
import type { PgTable } from 'drizzle-orm/pg-core'
import * as schema from './schema'

// Phase C (ZATCA Phase 2 integration) schema. See docs/PHASE2_DATA_MODEL_PROPOSAL.md.
const cfg = (t: PgTable) => getTableConfig(t)
const col = (t: PgTable, name: string) => cfg(t).columns.find((c) => c.name === name)
const columnNames = (t: PgTable) => cfg(t).columns.map((c) => c.name)
const uniqueOn = (t: PgTable, ...cols: string[]) =>
  cfg(t).indexes.some(
    (i) => i.config.unique && i.config.columns.map((c) => ('name' in c ? c.name : '')).join() === cols.join(),
  ) || (cols.length === 1 && col(t, cols[0])?.isUnique === true)
const fk = (t: PgTable, column: string) =>
  cfg(t).foreignKeys.find((f) => f.reference().columns.some((c) => c.name === column))

describe('Phase C schema: EGS units and credentials', () => {
  it('has one EGS unit per business, environment and serial, with its own ICV/PIH chain', () => {
    const t = schema.egsUnits
    expect(cfg(t).name).toBe('egs_units')
    for (const name of ['business_id', 'env', 'common_name', 'branch_name', 'egs_serial', 'invoice_type_flags', 'status', 'last_icv', 'last_pih', 'cert_not_after']) {
      expect(columnNames(t)).toContain(name)
    }
    expect(col(t, 'last_icv')?.notNull).toBe(true)
    expect(uniqueOn(t, 'business_id', 'env', 'egs_serial')).toBe(true)
    // Signed history must survive: a business with an EGS unit cannot be deleted.
    expect(fk(t, 'business_id')?.onDelete).toBe('restrict')
  })

  it('stores credential secrets only as ciphertext with a wrapped data key', () => {
    const t = schema.zatcaCredentials
    const names = columnNames(t)
    for (const name of ['private_key_enc', 'secret_enc', 'binary_security_token_enc', 'data_key_wrapped', 'kek_version', 'certificate_b64', 'not_after']) {
      expect(names).toContain(name)
    }
    expect(names).not.toContain('private_key')
    expect(names).not.toContain('secret')
    expect(names).not.toContain('otp')
    expect(fk(t, 'egs_unit_id')?.onDelete).toBe('cascade')
  })
})

describe('Phase C schema: invoices', () => {
  it('adds nullable ZATCA columns so existing and non-Saudi invoices are untouched', () => {
    const t = schema.invoices
    for (const name of ['egs_unit_id', 'zatca_kind', 'zatca_subtype', 'invoice_type_name', 'zatca_uuid', 'icv', 'pih', 'invoice_hash', 'qr_payload', 'signed_xml_key', 'cleared_xml_key', 'issue_date_ksa', 'issue_time_ksa', 'supply_date', 'billing_reference_invoice_id', 'adjustment_reason', 'signed_at', 'reported_at', 'report_due_at', 'zatca_last_error']) {
      expect(col(t, name), name).toBeDefined()
      expect(col(t, name)?.notNull, name).toBe(false)
    }
    expect(col(t, 'zatca_status')?.notNull).toBe(true)
    expect(col(t, 'zatca_status')?.default).toBe('not_required')
  })

  it('keeps the hash chain unique per EGS unit and the UUID unique overall', () => {
    expect(uniqueOn(schema.invoices, 'egs_unit_id', 'icv')).toBe(true)
    expect(uniqueOn(schema.invoices, 'zatca_uuid')).toBe(true)
    expect(fk(schema.invoices, 'egs_unit_id')?.onDelete).toBe('restrict')
  })

  it('logs every submission attempt without letting a submitted invoice be deleted', () => {
    const t = schema.zatcaSubmissions
    for (const name of ['invoice_id', 'egs_unit_id', 'endpoint', 'attempt', 'http_status', 'status', 'warnings', 'errors', 'requested_at', 'next_retry_at']) {
      expect(columnNames(t)).toContain(name)
    }
    expect(fk(t, 'invoice_id')?.onDelete).toBe('restrict')
  })
})

describe('Phase C schema: seller, buyer and line data ZATCA needs', () => {
  const address = ['street', 'building_number', 'additional_number', 'district', 'city', 'postal_code']

  it('gives businesses a CR number and a structured Saudi address', () => {
    for (const name of ['cr_number', ...address]) expect(columnNames(schema.businesses)).toContain(name)
    // Saudi-only product: no country switch on businesses.
    expect(columnNames(schema.businesses)).not.toContain('country')
  })

  it('gives clients a structured address and an ID scheme for buyers without a VAT number', () => {
    for (const name of ['country', 'id_scheme', 'id_value', ...address]) expect(columnNames(schema.clients)).toContain(name)
  })

  it('gives each line a VAT category and rate that default to standard-rated 15%', () => {
    const t = schema.lineItems
    expect(col(t, 'vat_category')?.notNull).toBe(true)
    expect(col(t, 'vat_category')?.default).toBe('S')
    expect(col(t, 'vat_rate')?.notNull).toBe(true)
    expect(col(t, 'vat_rate')?.default).toBe('15')
    for (const name of ['exemption_code', 'exemption_reason', 'discount_per_unit']) expect(columnNames(t)).toContain(name)
  })
})
