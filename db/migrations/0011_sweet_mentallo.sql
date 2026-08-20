CREATE TABLE "banquet_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"year" integer NOT NULL,
	"name" text NOT NULL,
	"affiliation" text,
	"email" text NOT NULL,
	"attending" boolean DEFAULT false NOT NULL,
	"allergens" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"allergen_other" text,
	"message" text,
	"confirmation_sent_at" timestamp with time zone,
	"emails_sent_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN "banquet_date" text;--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN "banquet_venue" text;--> statement-breakpoint
CREATE INDEX "banquet_responses_year_idx" ON "banquet_responses" USING btree ("year");--> statement-breakpoint
CREATE UNIQUE INDEX "banquet_responses_year_email_idx" ON "banquet_responses" USING btree ("year","email");