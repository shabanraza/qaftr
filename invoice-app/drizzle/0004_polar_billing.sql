ALTER TABLE "entitlements" ADD COLUMN "polar_customer_id" text;--> statement-breakpoint
ALTER TABLE "entitlements" ADD COLUMN "polar_subscription_id" text;--> statement-breakpoint
ALTER TABLE "entitlements" ADD COLUMN "current_period_end" timestamp;--> statement-breakpoint
ALTER TABLE "entitlements" ADD COLUMN "polar_changed_at" timestamp;