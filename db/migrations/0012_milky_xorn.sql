ALTER TABLE "banquet_responses" ADD COLUMN "responded_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "banquet_responses" ADD COLUMN "invitation_sent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "banquet_responses" ADD COLUMN "invitations_sent_count" integer DEFAULT 0 NOT NULL;