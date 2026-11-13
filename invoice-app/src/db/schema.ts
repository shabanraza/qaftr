import {
  boolean,
  date,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type { AnyPgColumn } from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Better Auth tables (must match the names Better Auth expects)
// ---------------------------------------------------------------------------

export const user = pgTable("user", {
  id: text().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text().primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text().notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text().primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text(),
  password: text(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text().primaryKey(),
  identifier: text().notNull(),
  value: text().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ---------------------------------------------------------------------------
// App enums
// ---------------------------------------------------------------------------

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "unpaid",
  "paid",
  "overdue",
]);

export const quoteStatusEnum = pgEnum("quote_status", [
  "draft",
  "pending",
  "accepted",
  "rejected",
  "converted",
]);

export const planEnum = pgEnum("plan", ["free", "pro"]);

export const entitlementStatusEnum = pgEnum("entitlement_status", [
  "active",
  "expired",
  "cancelled",
]);

export const languageEnum = pgEnum("language", ["ar", "en"]);

export const countryEnum = pgEnum("country", ["SA", "AE"]);

// ZATCA Phase 2 (integration). See docs/PHASE2_DATA_MODEL_PROPOSAL.md.
export const zatcaEnvEnum = pgEnum("zatca_env", ["sandbox", "simulation", "production"]);

export const egsStatusEnum = pgEnum("egs_status", [
  "pending_otp",
  "compliance",
  "active",
  "expiring",
  "revoked",
  "failed",
]);

export const zatcaStatusEnum = pgEnum("zatca_status", [
  "not_required",
  "draft",
  "signed",
  "queued",
  "reporting",
  "reported",
  "reported_with_warnings",
  "clearing",
  "cleared",
  "cleared_with_warnings",
  "rejected",
  "pending_clearance",
  "failed",
]);

export const zatcaDocKindEnum = pgEnum("zatca_doc_kind", ["invoice", "credit-note", "debit-note"]);

export const zatcaSubtypeEnum = pgEnum("zatca_subtype", ["standard", "simplified"]);

export const zatcaCredentialKindEnum = pgEnum("zatca_credential_kind", ["compliance", "production"]);

export const zatcaEndpointEnum = pgEnum("zatca_endpoint", ["compliance", "reporting", "clearance"]);

// UNCL5305 subset used by ZATCA: standard, zero-rated, exempt, out of scope.
export const vatCategoryEnum = pgEnum("vat_category", ["S", "Z", "E", "O"]);

// ---------------------------------------------------------------------------
// App tables
// ---------------------------------------------------------------------------

export const businesses = pgTable("businesses", {
  id: text().primaryKey(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en"),
  vatNumber: text("vat_number"),
  logoUrl: text("logo_url"),
  address: text(),
  defaultLanguage: languageEnum("default_language").notNull().default("ar"),
  country: countryEnum().notNull().default("SA"),
  // Structured seller identity and address (ZATCA BR-KSA-08/09/37/66).
  crNumber: text("cr_number"),
  street: text(),
  buildingNumber: text("building_number"),
  additionalNumber: text("additional_number"),
  district: text(),
  city: text(),
  postalCode: text("postal_code"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const clients = pgTable("clients", {
  id: text().primaryKey(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text().notNull(),
  vatNumber: text("vat_number"),
  email: text(),
  phone: text(),
  // ISO 3166-1 alpha-2; buyers can be outside SA/AE, so this is free text.
  country: text(),
  // Buyer ID when there is no VAT number: CRN, MOM, MLS, 700, SAG, NAT, GCC, IQA, PAS, OTH.
  idScheme: text("id_scheme"),
  idValue: text("id_value"),
  street: text(),
  buildingNumber: text("building_number"),
  additionalNumber: text("additional_number"),
  district: text(),
  city: text(),
  postalCode: text("postal_code"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// One EGS unit = one key pair + CSIDs + one ICV/PIH chain. Never shared across taxpayers.
// `restrict`: a business with signed history cannot be deleted.
export const egsUnits = pgTable(
  "egs_units",
  {
    id: text().primaryKey(),
    businessId: text("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "restrict" }),
    env: zatcaEnvEnum().notNull(),
    commonName: text("common_name").notNull(), // CSR CN
    branchName: text("branch_name").notNull(), // CSR OU
    egsSerial: text("egs_serial").notNull(), // "1-Qaftr|2-Web|3-<uuid>"
    invoiceTypeFlags: text("invoice_type_flags").notNull(), // "1100" | "1000" | "0100"
    location: text().notNull(),
    industry: text().notNull(),
    status: egsStatusEnum().notNull().default("pending_otp"),
    lastIcv: integer("last_icv").notNull().default(0),
    lastPih: text("last_pih").notNull(), // FIRST_INVOICE_PIH until the first signed document
    activeCredentialId: text("active_credential_id"),
    certNotAfter: timestamp("cert_not_after"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("egs_units_business_env_serial_unique").on(t.businessId, t.env, t.egsSerial)],
);

// Secrets are AES-256-GCM ciphertext under a per-row data key wrapped by a
// Workers-secret KEK (envelope encryption). OTPs are never stored.
export const zatcaCredentials = pgTable("zatca_credentials", {
  id: text().primaryKey(),
  egsUnitId: text("egs_unit_id")
    .notNull()
    .references(() => egsUnits.id, { onDelete: "cascade" }),
  kind: zatcaCredentialKindEnum().notNull(),
  requestId: text("request_id"),
  certificateB64: text("certificate_b64").notNull(), // public certificate
  binarySecurityTokenEnc: text("binary_security_token_enc").notNull(),
  secretEnc: text("secret_enc").notNull(),
  privateKeyEnc: text("private_key_enc").notNull(),
  dataKeyWrapped: text("data_key_wrapped").notNull(),
  kekVersion: integer("kek_version").notNull(),
  publicKeyMatches: boolean("public_key_matches").notNull(),
  issuedAt: timestamp("issued_at").notNull(),
  notAfter: timestamp("not_after").notNull(),
  revokedAt: timestamp("revoked_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const invoices = pgTable(
  "invoices",
  {
    id: text().primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    businessId: text("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    clientId: text("client_id").references(() => clients.id, {
      onDelete: "set null",
    }),
    // Sequential number scoped per business, e.g. INV-001
    seqNumber: integer("seq_number").notNull(),
    issueDate: timestamp("issue_date").notNull().defaultNow(),
    dueDate: timestamp("due_date"),
    status: invoiceStatusEnum().notNull().default("draft"),
    subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
    vatAmount: numeric("vat_amount", { precision: 12, scale: 2 }).notNull(),
    total: numeric("total", { precision: 12, scale: 2 }).notNull(),
    currency: text().notNull().default("SAR"),
    notes: text(),
    pdfUrl: text("pdf_url"),
    // ZATCA Phase 2. All nullable: existing, Phase 1 and UAE invoices keep NULLs.
    // Once zatca_status is 'signed' or later the invoice is immutable (app layer);
    // corrections go through a credit or debit note.
    egsUnitId: text("egs_unit_id").references(() => egsUnits.id, { onDelete: "restrict" }),
    zatcaKind: zatcaDocKindEnum("zatca_kind"),
    zatcaSubtype: zatcaSubtypeEnum("zatca_subtype"),
    invoiceTypeName: text("invoice_type_name"), // e.g. "0200000"
    zatcaUuid: uuid("zatca_uuid").unique("invoices_zatca_uuid_unique"),
    icv: integer(),
    pih: text(),
    invoiceHash: text("invoice_hash"),
    qrPayload: text("qr_payload"),
    signedXmlKey: text("signed_xml_key"), // R2 object key
    clearedXmlKey: text("cleared_xml_key"), // R2 object key
    issueDateKsa: date("issue_date_ksa"), // frozen at signing (Asia/Riyadh)
    issueTimeKsa: text("issue_time_ksa"),
    supplyDate: date("supply_date"),
    billingReferenceInvoiceId: text("billing_reference_invoice_id").references(
      (): AnyPgColumn => invoices.id,
      { onDelete: "restrict" },
    ),
    adjustmentReason: text("adjustment_reason"),
    zatcaStatus: zatcaStatusEnum("zatca_status").notNull().default("not_required"),
    zatcaLastError: jsonb("zatca_last_error"),
    signedAt: timestamp("signed_at"),
    reportedAt: timestamp("reported_at"),
    reportDueAt: timestamp("report_due_at"), // issue + 24 h for simplified invoices
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("invoices_business_id_seq_number_unique").on(
      table.businessId,
      table.seqNumber,
    ),
    uniqueIndex("invoices_egs_unit_id_icv_unique").on(table.egsUnitId, table.icv),
  ],
);

export const lineItems = pgTable("line_items", {
  id: text().primaryKey(),
  invoiceId: text("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  description: text().notNull(),
  qty: numeric("qty", { precision: 10, scale: 3 }).notNull(),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
  lineTotal: numeric("line_total", { precision: 12, scale: 2 }).notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  vatCategory: vatCategoryEnum("vat_category").notNull().default("S"),
  vatRate: numeric("vat_rate", { precision: 5, scale: 2 }).notNull().default("15"),
  exemptionCode: text("exemption_code"), // VATEX-SA-*
  exemptionReason: text("exemption_reason"),
  discountPerUnit: numeric("discount_per_unit", { precision: 12, scale: 2 }),
});

// Append-only log of every ZATCA API call. Messages only: no XML, no secrets.
export const zatcaSubmissions = pgTable("zatca_submissions", {
  id: text().primaryKey(),
  invoiceId: text("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "restrict" }),
  egsUnitId: text("egs_unit_id")
    .notNull()
    .references(() => egsUnits.id, { onDelete: "restrict" }),
  endpoint: zatcaEndpointEnum().notNull(),
  attempt: integer().notNull(),
  httpStatus: integer("http_status"), // 0 = network error
  status: text(), // PASS | WARNING | ERROR | CLEARANCE_DISABLED
  warnings: jsonb(),
  errors: jsonb(),
  requestedAt: timestamp("requested_at").notNull().defaultNow(),
  respondedAt: timestamp("responded_at"),
  nextRetryAt: timestamp("next_retry_at"),
});

export const quotes = pgTable(
  "quotes",
  {
    id: text().primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    businessId: text("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    clientId: text("client_id").references(() => clients.id, {
      onDelete: "set null",
    }),
    // Sequential number scoped per business, e.g. QTE-001
    seqNumber: integer("seq_number").notNull(),
    issueDate: timestamp("issue_date").notNull().defaultNow(),
    validUntil: timestamp("valid_until"),
    status: quoteStatusEnum().notNull().default("draft"),
    subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
    vatAmount: numeric("vat_amount", { precision: 12, scale: 2 }).notNull(),
    total: numeric("total", { precision: 12, scale: 2 }).notNull(),
    currency: text().notNull().default("SAR"),
    notes: text(),
    pdfUrl: text("pdf_url"),
    convertedToInvoiceId: text("converted_to_invoice_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("quotes_business_id_seq_number_unique").on(
      table.businessId,
      table.seqNumber,
    ),
  ],
);

export const quoteLineItems = pgTable("quote_line_items", {
  id: text().primaryKey(),
  quoteId: text("quote_id")
    .notNull()
    .references(() => quotes.id, { onDelete: "cascade" }),
  description: text().notNull(),
  qty: numeric("qty", { precision: 10, scale: 3 }).notNull(),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
  lineTotal: numeric("line_total", { precision: 12, scale: 2 }).notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const entitlements = pgTable("entitlements", {
  // One row per user — upserted by RevenueCat webhook
  ownerId: text("owner_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  plan: planEnum().notNull().default("free"),
  status: entitlementStatusEnum().notNull().default("active"),
  rcCustomerId: text("rc_customer_id"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const invoiceEvents = pgTable("invoice_events", {
  id: text().primaryKey(),
  invoiceId: text("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  ownerId: text("owner_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'created' | 'reminder_sent' | 'status_changed'
  channel: text("channel"), // 'whatsapp' | 'system'
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
