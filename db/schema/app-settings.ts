import { boolean, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

/**
 * Runtime, admin-editable global settings. Enforced to a single row via the
 * `singleton` column + its unique index — read/write with getAppSettings and an
 * upsert on the singleton conflict target.
 */
export const appSettings = pgTable(
  "app_settings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Always true; the unique index on it guarantees at most one settings row. */
    singleton: boolean("singleton").notNull().default(true),
    /** When true, check-in emails are redirected to the tester list (see testerEmails). */
    checkInTestMode: boolean("check_in_test_mode").notNull().default(false),
    /** Addresses that receive redirected check-in email while test mode is on. */
    testerEmails: jsonb("tester_emails").$type<string[]>().notNull().default([]),
    /** Admin-editable banquet date label (e.g. "July 9"). Null falls back to a built-in default. */
    banquetDate: text("banquet_date"),
    /** Admin-editable banquet venue label (e.g. "the Plaza Hotel"). Null falls back to a built-in default. */
    banquetVenue: text("banquet_venue"),
    ...timestamps,
  },
  (table) => [uniqueIndex("app_settings_singleton_idx").on(table.singleton)],
);

export type AppSettings = typeof appSettings.$inferSelect;
export type NewAppSettings = typeof appSettings.$inferInsert;
