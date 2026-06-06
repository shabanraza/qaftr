CREATE UNIQUE INDEX IF NOT EXISTS "invoices_business_id_seq_number_unique" ON "invoices" USING btree ("business_id","seq_number");
