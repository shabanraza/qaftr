-- ZATCA Phase 2 data model (docs/PHASE2_DATA_MODEL_PROPOSAL.md).
-- quotes, quote_line_items, invoice_events and two unique indexes were first created with
-- db:push and never captured in a migration; they are guarded here so this file runs on both
-- the live database and a fresh one. Everything ZATCA-specific is new and unguarded.
CREATE TYPE "public"."egs_status" AS ENUM('pending_otp', 'compliance', 'active', 'expiring', 'revoked', 'failed');
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."quote_status" AS ENUM('draft', 'pending', 'accepted', 'rejected', 'converted');
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TYPE "public"."vat_category" AS ENUM('S', 'Z', 'E', 'O');
--> statement-breakpoint
CREATE TYPE "public"."zatca_credential_kind" AS ENUM('compliance', 'production');
--> statement-breakpoint
CREATE TYPE "public"."zatca_doc_kind" AS ENUM('invoice', 'credit-note', 'debit-note');
--> statement-breakpoint
CREATE TYPE "public"."zatca_endpoint" AS ENUM('compliance', 'reporting', 'clearance');
--> statement-breakpoint
CREATE TYPE "public"."zatca_env" AS ENUM('sandbox', 'simulation', 'production');
--> statement-breakpoint
CREATE TYPE "public"."zatca_status" AS ENUM('not_required', 'draft', 'signed', 'queued', 'reporting', 'reported', 'reported_with_warnings', 'clearing', 'cleared', 'cleared_with_warnings', 'rejected', 'pending_clearance', 'failed');
--> statement-breakpoint
CREATE TYPE "public"."zatca_subtype" AS ENUM('standard', 'simplified');
--> statement-breakpoint
CREATE TABLE "egs_units" (
	"id" text PRIMARY KEY NOT NULL,
	"business_id" text NOT NULL,
	"env" "zatca_env" NOT NULL,
	"common_name" text NOT NULL,
	"branch_name" text NOT NULL,
	"egs_serial" text NOT NULL,
	"invoice_type_flags" text NOT NULL,
	"location" text NOT NULL,
	"industry" text NOT NULL,
	"status" "egs_status" DEFAULT 'pending_otp' NOT NULL,
	"last_icv" integer DEFAULT 0 NOT NULL,
	"last_pih" text NOT NULL,
	"active_credential_id" text,
	"cert_not_after" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "invoice_events" (
	"id" text PRIMARY KEY NOT NULL,
	"invoice_id" text NOT NULL,
	"owner_id" text NOT NULL,
	"type" text NOT NULL,
	"channel" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "quote_line_items" (
	"id" text PRIMARY KEY NOT NULL,
	"quote_id" text NOT NULL,
	"description" text NOT NULL,
	"qty" numeric(10, 3) NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"line_total" numeric(12, 2) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "quotes" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"business_id" text NOT NULL,
	"client_id" text,
	"seq_number" integer NOT NULL,
	"issue_date" timestamp DEFAULT now() NOT NULL,
	"valid_until" timestamp,
	"status" "quote_status" DEFAULT 'draft' NOT NULL,
	"subtotal" numeric(12, 2) NOT NULL,
	"vat_amount" numeric(12, 2) NOT NULL,
	"total" numeric(12, 2) NOT NULL,
	"currency" text DEFAULT 'SAR' NOT NULL,
	"notes" text,
	"pdf_url" text,
	"converted_to_invoice_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "zatca_credentials" (
	"id" text PRIMARY KEY NOT NULL,
	"egs_unit_id" text NOT NULL,
	"kind" "zatca_credential_kind" NOT NULL,
	"request_id" text,
	"certificate_b64" text NOT NULL,
	"binary_security_token_enc" text NOT NULL,
	"secret_enc" text NOT NULL,
	"private_key_enc" text NOT NULL,
	"data_key_wrapped" text NOT NULL,
	"kek_version" integer NOT NULL,
	"public_key_matches" boolean NOT NULL,
	"issued_at" timestamp NOT NULL,
	"not_after" timestamp NOT NULL,
	"revoked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "zatca_submissions" (
	"id" text PRIMARY KEY NOT NULL,
	"invoice_id" text NOT NULL,
	"egs_unit_id" text NOT NULL,
	"endpoint" "zatca_endpoint" NOT NULL,
	"attempt" integer NOT NULL,
	"http_status" integer,
	"status" text,
	"warnings" jsonb,
	"errors" jsonb,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"responded_at" timestamp,
	"next_retry_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "cr_number" text;
--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "street" text;
--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "building_number" text;
--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "additional_number" text;
--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "district" text;
--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "city" text;
--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "postal_code" text;
--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "country" text;
--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "id_scheme" text;
--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "id_value" text;
--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "street" text;
--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "building_number" text;
--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "additional_number" text;
--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "district" text;
--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "city" text;
--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "postal_code" text;
--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "egs_unit_id" text;
--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "zatca_kind" "zatca_doc_kind";
--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "zatca_subtype" "zatca_subtype";
--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "invoice_type_name" text;
--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "zatca_uuid" uuid;
--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "icv" integer;
--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "pih" text;
--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "invoice_hash" text;
--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "qr_payload" text;
--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "signed_xml_key" text;
--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "cleared_xml_key" text;
--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "issue_date_ksa" date;
--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "issue_time_ksa" text;
--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "supply_date" date;
--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "billing_reference_invoice_id" text;
--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "adjustment_reason" text;
--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "zatca_status" "zatca_status" DEFAULT 'not_required' NOT NULL;
--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "zatca_last_error" jsonb;
--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "signed_at" timestamp;
--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "reported_at" timestamp;
--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "report_due_at" timestamp;
--> statement-breakpoint
ALTER TABLE "line_items" ADD COLUMN "vat_category" "vat_category" DEFAULT 'S' NOT NULL;
--> statement-breakpoint
ALTER TABLE "line_items" ADD COLUMN "vat_rate" numeric(5, 2) DEFAULT '15' NOT NULL;
--> statement-breakpoint
ALTER TABLE "line_items" ADD COLUMN "exemption_code" text;
--> statement-breakpoint
ALTER TABLE "line_items" ADD COLUMN "exemption_reason" text;
--> statement-breakpoint
ALTER TABLE "line_items" ADD COLUMN "discount_per_unit" numeric(12, 2);
--> statement-breakpoint
ALTER TABLE "egs_units" ADD CONSTRAINT "egs_units_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "invoice_events" ADD CONSTRAINT "invoice_events_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "invoice_events" ADD CONSTRAINT "invoice_events_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quote_line_items" ADD CONSTRAINT "quote_line_items_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quotes" ADD CONSTRAINT "quotes_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quotes" ADD CONSTRAINT "quotes_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quotes" ADD CONSTRAINT "quotes_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "zatca_credentials" ADD CONSTRAINT "zatca_credentials_egs_unit_id_egs_units_id_fk" FOREIGN KEY ("egs_unit_id") REFERENCES "public"."egs_units"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "zatca_submissions" ADD CONSTRAINT "zatca_submissions_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "zatca_submissions" ADD CONSTRAINT "zatca_submissions_egs_unit_id_egs_units_id_fk" FOREIGN KEY ("egs_unit_id") REFERENCES "public"."egs_units"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "egs_units_business_env_serial_unique" ON "egs_units" USING btree ("business_id","env","egs_serial");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "quotes_business_id_seq_number_unique" ON "quotes" USING btree ("business_id","seq_number");
--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_egs_unit_id_egs_units_id_fk" FOREIGN KEY ("egs_unit_id") REFERENCES "public"."egs_units"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_billing_reference_invoice_id_invoices_id_fk" FOREIGN KEY ("billing_reference_invoice_id") REFERENCES "public"."invoices"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "invoices_business_id_seq_number_unique" ON "invoices" USING btree ("business_id","seq_number");
--> statement-breakpoint
CREATE UNIQUE INDEX "invoices_egs_unit_id_icv_unique" ON "invoices" USING btree ("egs_unit_id","icv");
--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_zatca_uuid_unique" UNIQUE("zatca_uuid");
