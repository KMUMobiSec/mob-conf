CREATE TABLE "registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"year" integer NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"affiliation" text,
	"qr_nonce" text NOT NULL,
	"qr_email_sent_at" timestamp with time zone,
	"qr_email_sent_count" integer DEFAULT 0 NOT NULL,
	"checked_in_at" timestamp with time zone,
	"checked_in_by" text,
	"welcome_email_sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "registrations_year_idx" ON "registrations" USING btree ("year");--> statement-breakpoint
CREATE UNIQUE INDEX "registrations_qr_nonce_idx" ON "registrations" USING btree ("qr_nonce");--> statement-breakpoint
CREATE UNIQUE INDEX "registrations_year_email_idx" ON "registrations" USING btree ("year","email");