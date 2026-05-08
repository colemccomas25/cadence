ALTER TABLE "studios" ADD COLUMN "stripe_connect_account_id" text;--> statement-breakpoint
ALTER TABLE "studios" ADD COLUMN "stripe_connect_charges_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "studios" ADD COLUMN "stripe_connect_payouts_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "studios" ADD COLUMN "stripe_connect_details_submitted" boolean DEFAULT false NOT NULL;