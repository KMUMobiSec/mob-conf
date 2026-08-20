DROP INDEX "registrations_year_email_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "registrations_year_email_name_idx" ON "registrations" USING btree ("year","email","name");