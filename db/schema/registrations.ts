import { index, integer, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

export const registrations = pgTable(
  "registrations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    year: integer("year").notNull(),
    /**
     * Normalized lowercase attendee email. Unique per conference year together with the name, so
     * one shared email can register several distinct people. Null for walk-ins with no email.
     */
    email: text("email"),
    name: text("name").notNull(),
    affiliation: text("affiliation"),

    /**
     * Participant/badge number from the official participant list (`No.` column). Nullable:
     * walk-ins and anyone not on the list have none. Not unique — the list is authoritative for
     * uniqueness, and a DB constraint would turn a data slip into a live-event import failure.
     */
    idNumber: integer("id_number"),

    /** High-entropy nonce used to derive a signed QR credential. */
    qrNonce: text("qr_nonce").notNull(),
    qrEmailSentAt: timestamp("qr_email_sent_at", { withTimezone: true }),
    qrEmailSentCount: integer("qr_email_sent_count").notNull().default(0),

    checkedInAt: timestamp("checked_in_at", { withTimezone: true }),
    checkedInBy: text("checked_in_by"),
    welcomeEmailSentAt: timestamp("welcome_email_sent_at", { withTimezone: true }),

    /** Last time this registrant's certificate was emailed (null = never sent). */
    certificateEmailSentAt: timestamp("certificate_email_sent_at", { withTimezone: true }),
    certificateEmailSentCount: integer("certificate_email_sent_count").notNull().default(0),

    ...timestamps,
  },
  (table) => [
    index("registrations_year_idx").on(table.year),
    // Backs the check-in log query (year + checked_in_at IS NOT NULL, ordered by checked_in_at) and
    // the checked-in count, which otherwise scan every row for the year.
    index("registrations_year_checked_in_at_idx").on(table.year, table.checkedInAt),
    uniqueIndex("registrations_qr_nonce_idx").on(table.qrNonce),
    // A person is identified by (year, email, name): the same email can register several distinct
    // attendees, but the same name+email is a duplicate. Walk-ins (null email) are always distinct.
    uniqueIndex("registrations_year_email_name_idx").on(table.year, table.email, table.name),
  ],
);

export type Registration = typeof registrations.$inferSelect;
export type NewRegistration = typeof registrations.$inferInsert;
