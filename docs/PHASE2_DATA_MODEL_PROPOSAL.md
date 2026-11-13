# ZATCA Phase 2: data model and runtime proposal (2026-11-09)

Status: **proposal only.** No schema, migration, auth, billing or mobile code has changed. This builds on
`packages/shared/src/zatca-phase2/` (builder, hash, XAdES, QR, CSR, API client) and on §6 of
`docs/ZATCA_DEVELOPER_PORTAL_RESEARCH_2026-11-09.md`. The table names follow this doc. The research doc calls the credentials table
`egs_credentials`; pick one name before writing the migration.

## 1. Gaps in today's schema (`invoice-app/src/db/schema.ts`)

| Need (ZATCA) | Today | Gap |
|---|---|---|
| Seller: CRN/other ID, structured address (building 4 digits, district, city, postal 5 digits) | `businesses.address` is free text | Structured columns are needed. BR-KSA-08/09/37/66 fail without them. |
| Buyer: name, VAT/other ID, structured SA address (standard invoices) | `clients` has name and VAT only | Add structured address and `id_scheme`/`id_value`. |
| UUID, ICV, PIH, hash, type/subtype, signed XML, QR, ZATCA status | none | New invoice columns plus a submission log. |
| Line VAT category, rate, exemption code, discount | `line_items` has qty, price, total | Add `vat_category`, `vat_rate`, `exemption_code`, `exemption_reason`, `discount_per_unit`. |
| Supply date, credit/debit note reference and reason | none | `supply_date`, `billing_reference_invoice_id`, `adjustment_reason`. |
| Issue time | `issue_date` is a timestamp | Derive `IssueDate`/`IssueTime` in Asia/Riyadh at signing, then **freeze** them in new columns. |

## 2. Proposed Drizzle schema (sketch)

```ts
export const zatcaEnvEnum = pgEnum("zatca_env", ["sandbox", "simulation", "production"]);
export const egsStatusEnum = pgEnum("egs_status", [
  "pending_otp", "compliance", "active", "expiring", "revoked", "failed",
]);
export const zatcaStatusEnum = pgEnum("zatca_status", [
  "not_required", "draft", "signed", "queued", "reporting", "reported", "reported_with_warnings",
  "clearing", "cleared", "cleared_with_warnings", "rejected", "pending_clearance", "failed",
]);

// One EGS unit = one key + CSIDs + one ICV/PIH chain. Never share across taxpayers.
export const egsUnits = pgTable("egs_units", {
  id: text().primaryKey(),
  businessId: text("business_id").notNull().references(() => businesses.id, { onDelete: "restrict" }),
  env: zatcaEnvEnum().notNull(),
  commonName: text("common_name").notNull(),           // CSR CN
  branchName: text("branch_name").notNull(),           // CSR OU (10-digit TIN for VAT groups)
  egsSerial: text("egs_serial").notNull(),             // "1-Qaftr|2-Web|3-<uuid>"
  invoiceTypeFlags: text("invoice_type_flags").notNull(), // "1100" | "1000" | "0100"
  location: text().notNull(), industry: text().notNull(),
  status: egsStatusEnum().notNull().default("pending_otp"),
  lastIcv: integer("last_icv").notNull().default(0),
  lastPih: text("last_pih").notNull(),                 // FIRST_INVOICE_PIH initially
  activeCredentialId: text("active_credential_id"),
  certNotAfter: timestamp("cert_not_after"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [uniqueIndex("egs_units_business_env_serial").on(t.businessId, t.env, t.egsSerial)]);

// Secrets are never stored in plaintext: *_enc = AES-256-GCM ciphertext (envelope, see §5).
export const zatcaCredentials = pgTable("zatca_credentials", {
  id: text().primaryKey(),
  egsUnitId: text("egs_unit_id").notNull().references(() => egsUnits.id, { onDelete: "cascade" }),
  kind: text().notNull(),                               // 'compliance' | 'production'
  requestId: text("request_id"),                        // compliance_request_id
  certificateB64: text("certificate_b64").notNull(),    // public; decoded binarySecurityToken
  binarySecurityTokenEnc: text("binary_security_token_enc").notNull(),
  secretEnc: text("secret_enc").notNull(),
  privateKeyEnc: text("private_key_enc").notNull(),     // SEC1 PEM, encrypted
  dataKeyWrapped: text("data_key_wrapped").notNull(),   // DEK wrapped by KEK
  kekVersion: integer("kek_version").notNull(),
  publicKeyMatches: boolean("public_key_matches").notNull(), // cert key == our key (sandbox PCSID: false)
  issuedAt: timestamp("issued_at").notNull(), notAfter: timestamp("not_after").notNull(),
  revokedAt: timestamp("revoked_at"),
});

// invoices: additive, nullable columns (non-Saudi/Phase-1 invoices keep NULLs)
//   egs_unit_id, zatca_kind ('invoice'|'credit-note'|'debit-note'), zatca_subtype ('standard'|'simplified'),
//   invoice_type_name ('0200000'), zatca_uuid (uuid, unique), icv (int), pih (text),
//   issue_date_ksa (date), issue_time_ksa (text), supply_date (date),
//   invoice_hash (text), qr_payload (text), signed_xml_key (R2 key), cleared_xml_key (R2 key),
//   zatca_status (zatcaStatusEnum, default 'not_required'), zatca_last_error (jsonb),
//   billing_reference_invoice_id, adjustment_reason, signed_at, reported_at, report_due_at
//   unique (egs_unit_id, icv)

export const zatcaSubmissions = pgTable("zatca_submissions", {    // append-only log
  id: text().primaryKey(),
  invoiceId: text("invoice_id").notNull().references(() => invoices.id, { onDelete: "restrict" }),
  egsUnitId: text("egs_unit_id").notNull().references(() => egsUnits.id),
  endpoint: text().notNull(),                    // 'compliance' | 'reporting' | 'clearance'
  attempt: integer().notNull(),
  httpStatus: integer("http_status"),            // 0 = network error
  status: text(),                                // PASS | WARNING | ERROR | CLEARANCE_DISABLED
  warnings: jsonb(), errors: jsonb(),            // ZatcaMessage[] (no secrets, no XML)
  requestedAt: timestamp("requested_at").notNull().defaultNow(),
  respondedAt: timestamp("responded_at"),
  nextRetryAt: timestamp("next_retry_at"),
});
```

Plus structured address columns on `businesses` (`cr_number`, `street`, `building_number`, `additional_number`, `district`,
`city`, `postal_code`) and on `clients` (the same fields plus `id_scheme`, `id_value`, `country`), and the line VAT columns from §1.

**Signed invoices are immutable.** Once `zatca_status >= signed`, block edits in the app layer. Corrections go through a
credit or debit note. Never delete a signed invoice. That is why the foreign keys above use `restrict`.

## 3. Migration plan

1. `0002_zatca_phase2_tables`: enums, `egs_units`, `zatca_credentials`, `zatca_submissions`. Purely additive.
2. `0003_zatca_invoice_columns`: nullable invoice, line, business and client columns, the unique `(egs_unit_id, icv)` and the unique `zatca_uuid`.
   Backfill: `vat_category='S'`, `vat_rate=15` for existing lines. Existing invoices keep `zatca_status='not_required'`.
3. Ship the UI that captures structured addresses and CRN before onboarding (validation uses `validateZatcaInvoice`).
4. Gate behind a `zatca_phase2` Pro entitlement and run on `sandbox` first, then `simulation` with a beta customer's OTP, then `production`.
5. Generate migrations with drizzle-kit, review the SQL by hand and apply to a Neon branch first.

## 4. Where signing runs

**In the Worker.** `@noble/curves` signs in about 1–3 ms of CPU, so no separate signing service is needed (proven by the POC and by
`packages/shared` tests). Keys never reach the browser or the mobile app.

**Serialization per EGS is mandatory.** Two documents signed with the same PIH break the chain. Options:
- **A. Durable Object per EGS unit (recommended).** It owns `lastIcv`/`lastPih` in DO storage, assigns ICV, builds, hashes and signs, writes the
  row to Postgres (`icv`, `pih`, `hash`, R2 key) and only then advances. DO storage is the source of truth for the counter, and Postgres mirrors it.
  If a Postgres write fails, retry with the same ICV (idempotent on `zatca_uuid`).
- **B. Postgres only.** One transaction does `SELECT ... FROM egs_units WHERE id=$1 FOR UPDATE`, signs, inserts and updates `last_icv`/`last_pih`.
  This is simpler, but it holds a row lock during signing and needs a Neon connection that supports transactions (not the HTTP driver).

Flow: `invoices.issue` (tRPC) → validate → DO `sign(invoiceId)` → store signed XML in R2 → then either **simplified**: enqueue for reporting and
return the PDF/QR immediately, or **standard**: clear synchronously with a timeout of about 10 s, store `clearedInvoice` and render the PDF from the
cleared XML/QR. Standard flow edge cases:
- **303:** report instead.
- **Timeout or 5xx:** set status `pending_clearance` and block sharing.

**Local verification gate (the sandbox is lenient).** Before submitting, run `verifySignedInvoice(signedXml)` and assert `valid`. Also check
`publicKeyMatches` on the credential. The developer-portal sandbox accepted tampered bodies, unrelated-key signatures and a PCSID not bound to our key,
so a sandbox PASS proves nothing about the signature.

## 5. Keys and secrets (envelope encryption)

- `ZATCA_KEK_V{n}`: a 256-bit key held as a Workers secret (or in Cloudflare Secrets Store). It never goes in the database or the logs.
- Per credential row: generate a random 256-bit DEK and encrypt the private key, token and secret with AES-256-GCM (WebCrypto, using a 12-byte
  random IV stored with the ciphertext). Wrap the DEK with the KEK (AES-KW or AES-GCM) and store `data_key_wrapped` and `kek_version`.
- Rotation: add `ZATCA_KEK_V{n+1}` and re-wrap the DEKs in a background job. The ciphertexts stay untouched.
- Redact the `Authorization`, `OTP`, `binarySecurityToken` and `secret` headers and fields in every log. The submission log stores messages only.
- OTPs are single-use and short-lived. Accept them in the request body, use them at once and never persist them.

## 6. 24-hour reporting queue

- **Cloudflare Queue `zatca-reporting`.** The message is `{ invoiceId }`. The consumer loads the signed XML from R2, calls `reportInvoice`, writes
  `zatca_submissions` and updates the status.
  - `retryable` errors (network, 429, 5xx) are retried with exponential backoff (1 min → 2 h).
  - 400 is a final `rejected`. Surface the error codes in AR/EN and require a corrective credit note or re-issue.
- **Cron (every 15 min) sweeper.** It re-enqueues `queued`/`failed` documents whose `report_due_at` (issue + 24 h) is near, alerts at 20 h and
  flags breaches. The same cron re-tries `pending_clearance`.
- Idempotency: ZATCA de-duplicates by UUID. Treat 409 as already submitted and fetch nothing.

## 7. Certificate lifecycle

- On onboarding: `generateZatcaKeyPair` → `buildZatcaCsr` → `requestComplianceCsid(otp)` → 1–6 compliance documents (one per type the
  flags declare, built and signed with the CCSID) → `requestProductionCsid`. Store `notAfter` from `parseCertificate`.
- **Renewal:** a daily cron marks units `expiring` 30 days before `notAfter` and emails or WhatsApps the owner to fetch an OTP. Then
  `renewProductionCsid` runs with a new CSR. Generate a new key pair, and keep the old credential until the new one is active.
- **Revocation or 401 from ZATCA:** set the unit to `revoked`, stop signing for it and guide the owner through re-onboarding.
  Never fall back to another unit's key.

## 8. Open items

- Validate golden XMLs with the official ZATCA SDK (`fatoora -validate`) in CI. That needs user approval to download the SDK.
- Decide the EGS granularity: per business (simplest) or per branch/device.
- Plan multi-currency (TaxCurrencyCode SAR with a foreign DocumentCurrencyCode) and document-level allowances. The builder does not support either yet.
