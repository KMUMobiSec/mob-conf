CREATE TABLE "presentation_roster" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"year" integer NOT NULL,
	"paper_number" text NOT NULL,
	"title" text NOT NULL,
	"author" text NOT NULL,
	"contact_email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "presentation_roster_year_paper_number_key" UNIQUE("year","paper_number")
);
--> statement-breakpoint
CREATE INDEX "presentation_roster_year_idx" ON "presentation_roster" USING btree ("year");