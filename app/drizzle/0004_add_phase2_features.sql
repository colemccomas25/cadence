CREATE TABLE IF NOT EXISTS "parent_magic_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_email" text NOT NULL,
	"token" text NOT NULL,
	"consumed_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "parent_magic_links_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "parent_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_email" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "parent_sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "practice_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"studio_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"minutes" integer NOT NULL,
	"note" text,
	"submitted_by_email" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lesson_templates" ADD COLUMN "template_group_id" uuid;--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN "lesson_group_id" uuid;--> statement-breakpoint
ALTER TABLE "parent_contacts" ADD COLUMN "stripe_payment_method_id" text;--> statement-breakpoint
ALTER TABLE "parent_contacts" ADD COLUMN "auto_charge_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "parent_contacts" ADD COLUMN "auto_charge_authorized_at" timestamp with time zone;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "practice_logs" ADD CONSTRAINT "practice_logs_studio_id_studios_id_fk" FOREIGN KEY ("studio_id") REFERENCES "public"."studios"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "practice_logs" ADD CONSTRAINT "practice_logs_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "parent_sessions_email_idx" ON "parent_sessions" USING btree ("parent_email");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "practice_logs_student_date_idx" ON "practice_logs" USING btree ("student_id","date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "lessons_group_idx" ON "lessons" USING btree ("lesson_group_id");