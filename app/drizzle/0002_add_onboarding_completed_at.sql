ALTER TABLE "studios" ADD COLUMN "onboarding_completed_at" timestamp with time zone;
UPDATE "studios" SET "onboarding_completed_at" = NOW() WHERE "onboarding_completed_at" IS NULL;