ALTER TABLE "entitlements" ADD COLUMN "store_pro" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "entitlements" ADD COLUMN "polar_pro" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "entitlements" ADD COLUMN "polar_customer_id" text;--> statement-breakpoint
ALTER TABLE "entitlements" ADD COLUMN "polar_subscription_id" text;--> statement-breakpoint
ALTER TABLE "entitlements" ADD COLUMN "current_period_end" timestamp;--> statement-breakpoint
ALTER TABLE "entitlements" ADD COLUMN "polar_changed_at" timestamp;--> statement-breakpoint
-- Existing Pro rows came from RevenueCat (the only source before Polar).
UPDATE "entitlements" SET "store_pro" = true WHERE "plan" = 'pro' AND "status" = 'active';
