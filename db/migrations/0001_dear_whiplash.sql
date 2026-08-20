CREATE TABLE "nominations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"year" integer NOT NULL,
	"award" text NOT NULL,
	"nominator_name" text NOT NULL,
	"nominator_email" text NOT NULL,
	"nominator_affiliation" text NOT NULL,
	"nominator_relationship" text NOT NULL,
	"nominee_name" text NOT NULL,
	"nominee_email" text NOT NULL,
	"nominee_affiliation" text NOT NULL,
	"nominee_position" text NOT NULL,
	"nominee_country" text NOT NULL,
	"degree" text,
	"enrollment" text,
	"statement" text NOT NULL,
	"consent" boolean DEFAULT false NOT NULL,
	"documents" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"slide_pages" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "nominations_year_idx" ON "nominations" USING btree ("year");