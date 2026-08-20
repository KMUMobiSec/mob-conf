DROP INDEX "banquet_responses_year_email_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "banquet_responses_year_email_name_idx" ON "banquet_responses" USING btree ("year","email","name");