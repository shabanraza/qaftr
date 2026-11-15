CREATE TABLE "business_members" (
	"id" text PRIMARY KEY NOT NULL,
	"business_id" text NOT NULL,
	"accountant_user_id" text,
	"email" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"accepted_at" timestamp,
	"revoked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "business_members" ADD CONSTRAINT "business_members_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_members" ADD CONSTRAINT "business_members_accountant_user_id_user_id_fk" FOREIGN KEY ("accountant_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "business_members_token_hash_unique" ON "business_members" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "business_members_business_idx" ON "business_members" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "business_members_accountant_idx" ON "business_members" USING btree ("accountant_user_id");